# 悦安居 · 家装软装自动出图平台 — 系统设计

> 日期：2026-03-09
> 状态：已批准
> 方案：方案 C — 前端代理 + 可选 Webhook 增强

---

## 1. 项目概述

### 背景

客户通过 RunningHub 平台购买 API 额度，生成 API Key 转卖给下游室内设计师用户。本平台作为中间层，提供专业美观的前端界面，让用户输入 API Key 后即可调用 RunningHub 的 AI 应用生成设计效果图。

### 品牌

- **品牌名**：悦安居
- **定位**：家装软装自动出图方案
- **前端不出现** RunningHub 相关文案（后台管理除外）

### 集成的 AI 应用（初始 4 个）

| 应用名 | RunningHub ID | 核心功能 |
|--------|---------------|---------|
| 一键彩平 | `1994388299756212225` | CAD 平面白图填色变立体 |
| 外观迁移 | `1986819253754130433` | 从参考图提取风格迁移到原图 |
| 平面转效果 | `2003678561775067138` | 最多 9 张图融合生成效果图 |
| 毛坯转效果 | `2023563076041183233` | 毛坯房一键生成装修效果图 |

---

## 2. 核心决策

| 维度 | 决策 | 理由 |
|------|------|------|
| 技术栈 | Next.js 15 (App Router) 全栈 | 前后端一体，部署灵活 |
| UI | Tailwind CSS + shadcn/ui | 专业美观、组件丰富 |
| 用户体系 | 纯 API Key 模式，无注册登录 | 简单直接，Key 即身份 |
| 前端存储 | IndexedDB (Dexie.js) | 任务历史、使用记录 |
| 服务端存储 | SQLite + Prisma | 应用配置、倍率、管理员 |
| 状态管理 | Zustand | 轻量，适合任务队列 |
| 校验 | Zod | 前后端共享 schema |
| 包管理 | pnpm | 速度快、磁盘效率高 |
| 部署 | Docker + 直接部署双支持 | 满足不同运维能力 |

---

## 3. 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    用户浏览器                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │localStorage│ │ IndexedDB │  │  React 前端 (Next) │  │
│  │ (API Key)  │ │(任务历史) │  │  Zustand 状态管理  │  │
│  └──────────┘  └──────────┘  └────────┬──────────┘  │
└───────────────────────────────────────┼──────────────┘
                                        │
                          ┌─────────────▼──────────────┐
                          │   Next.js API Routes        │
                          │   (代理层 + 管理API)         │
                          │                             │
                          │  ┌─────────┐ ┌───────────┐ │
                          │  │任务代理  │ │后台管理API │ │
                          │  │(转发RH) │ │(CRUD应用) │ │
                          │  └────┬────┘ └─────┬─────┘ │
                          │       │            │        │
                          │  ┌────▼────────────▼─────┐ │
                          │  │   SQLite + Prisma      │ │
                          │  │  (应用配置/倍率/管理)   │ │
                          │  └────────────────────────┘ │
                          │       │                     │
                          │  ┌────▼────────────────┐   │
                          │  │ Webhook 接收端(可选) │   │
                          │  └─────────────────────┘   │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼──────────────┐
                          │    RunningHub API           │
                          │  (上传/创建任务/查询/回调)    │
                          └────────────────────────────┘
```

---

## 4. 数据模型

### 4.1 服务端 SQLite (Prisma)

**AiApp** — AI 应用配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (PK) | 自动生成 |
| name | String | 前端显示名 |
| description | String | 应用描述 |
| icon | String | 图标标识 |
| rhAppId | String | RunningHub 应用 ID |
| category | String | 分类标签 |
| sortOrder | Int | 排序 |
| enabled | Boolean | 是否启用 |
| multiplier | Float | 单应用倍率覆盖（可选） |
| config | Json | 扩展配置 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**AiAppField** — 应用字段配置（与 AiApp 一对多）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (PK) | 自动生成 |
| appId | String (FK) | 关联应用 |
| nodeId | String | RunningHub nodeId |
| fieldName | String | RunningHub fieldName |
| fieldType | Enum | IMAGE / STRING / INT / LIST / BOOLEAN |
| label | String | 前端显示标签 |
| description | String | 字段说明 |
| required | Boolean | 是否必填 |
| defaultValue | String? | 默认值 |
| options | Json? | LIST 类型的选项 |
| sortOrder | Int | 排序 |

**KeyMultiplier** — Key 倍率配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (PK) | 自动生成 |
| apiKeyHash | String (Unique) | API Key 的 SHA256 哈希 |
| multiplier | Float | 倍率 |
| note | String? | 备注（如客户名） |
| createdAt | DateTime | 创建时间 |

**AdminUser** — 管理员

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (PK) | 自动生成 |
| username | String (Unique) | 用户名 |
| passwordHash | String | bcrypt 哈希 |
| createdAt | DateTime | 创建时间 |

**SystemConfig** — 系统配置（键值对）

| 字段 | 类型 | 说明 |
|------|------|------|
| key | String (PK) | 配置键 |
| value | String | 配置值 |
| updatedAt | DateTime | 更新时间 |

### 4.2 前端 IndexedDB (Dexie.js)

**TaskHistory** — 任务历史

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Number (Auto PK) | 自增主键 |
| apiKeyHash | String (索引) | Key 哈希，隔离数据 |
| appId | String | 关联的 AI 应用 |
| appName | String | 冗余存储 |
| taskId | String (唯一) | RunningHub taskId |
| status | Enum | QUEUED / RUNNING / SUCCESS / FAILED |
| inputs | Json | 用户输入快照 |
| outputs | Json | 结果链接 |
| createdAt | DateTime (索引) | 创建时间 |
| completedAt | DateTime? | 完成时间 |
| costInfo | Json? | 预估费用 |

存储策略：定期清理 30 天以上记录，Key 切换时按 hash 隔离。

---

## 5. 路由结构

```
# 用户侧
/                           → 落地页（品牌宣传 + 功能介绍）
/workspace                  → 工作台主页（应用列表卡片）
/workspace/[appId]          → 具体应用工作区（动态渲染）
/history                    → 任务历史记录
/settings                   → 用户设置（API Key 管理）

# 后台管理
/admin/login                → 后台登录
/admin                      → 后台仪表盘
/admin/apps                 → AI 应用管理（CRUD）
/admin/apps/[id]/edit       → 编辑应用
/admin/keys                 → Key 倍率管理
/admin/settings             → 系统设置
```

---

## 6. API 设计

### 6.1 用户侧 API（代理层）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 代理上传图片到 RunningHub |
| POST | `/api/task/create` | 代理创建 AI 任务 |
| POST | `/api/task/status` | 代理查询任务状态 |
| POST | `/api/task/result` | 代理查询任务结果 |
| POST | `/api/account/balance` | 代理查询账户余额 |
| POST | `/api/webhook/callback` | 接收 Webhook 回调 |

### 6.2 前端数据 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/apps` | 获取已启用的应用列表及字段配置 |
| GET | `/api/apps/[appId]` | 获取单个应用详情 |

### 6.3 后台管理 API（JWT 鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 管理员登录 |
| GET/POST | `/api/admin/apps` | 应用列表 / 创建应用 |
| PUT/DELETE | `/api/admin/apps/[id]` | 更新 / 删除应用 |
| GET/POST | `/api/admin/keys` | Key 倍率列表 / 设置倍率 |
| DELETE | `/api/admin/keys/[id]` | 删除 Key 倍率 |
| GET/PUT | `/api/admin/settings` | 获取 / 更新系统配置 |

---

## 7. 任务生命周期

```
用户点击"开始生成"
  → 前端校验（Key 存在、必填字段、并发数 ≤ 30）
  → 有图片则逐张上传（POST /api/upload → 返回 fileName）
  → 组装 nodeInfoList（fileName 回填图片字段）
  → POST /api/task/create → 返回 taskId
  → 任务入前端队列 (Zustand) + 写入 IndexedDB
  → 轮询状态：
      0-30s   → 每 3s
      30-120s → 每 5s
      120s+   → 每 10s
      超时 10min → 标记失败
  → 可选：Webhook 模式（管理后台开启后，RunningHub 回调 → SSE 推送前端）
  → SUCCESS → 显示结果 + 提醒下载
  → FAILED  → 显示错误 + 重试按钮
```

---

## 8. 代理层安全设计

- 从请求 Header 提取用户 API Key，不缓存不存储
- 请求频率限制（per Key，基于内存计数器）
- 文件上传限制：单文件 10MB，支持 jpg/png/webp
- 前端最大并发任务数：默认 30（可配置）
- RunningHub 错误码映射为中文友好提示
- 管理后台 JWT 鉴权，Key 哈希存储（SHA256）

---

## 9. 动态表单组件映射

| AiAppField.fieldType | 前端组件 | 说明 |
|----------------------|---------|------|
| `IMAGE` | `ImageUploader` | 拖拽上传 + 预览 + 压缩提示 |
| `STRING` | `TextInput` / `TextArea` | 短文本/长文本自适应 |
| `INT` | `NumberInput` + 滑块 | 带范围限制 |
| `LIST` | `Select` 下拉选择 | 从 options 读取 |
| `BOOLEAN` | `Switch` 开关 | 如"开启8K" |

组件化逻辑：读取应用配置 → 遍历 fields → 按 fieldType 渲染 → 用户填写后组装 nodeInfoList。

多图输入（如平面转效果最多 9 张）采用动态增减槽位方式：默认显示必填槽位，用户可点击"添加更多参考图"按需增加。

---

## 10. 后台管理

### 访问方式

- 路径：`/admin`
- 默认账户：`admin` / `admin123`（可通过环境变量覆盖）

### 添加新应用流程

1. 填写基础信息（名称、描述、图标、RunningHub 应用 ID）
2. **粘贴 RunningHub curl 命令 → 系统自动解析 nodeInfoList**
3. 调整字段配置（标签、必填、默认值、选项）
4. 预览 & 保存

### Key 倍率管理

- 全局默认倍率（SystemConfig 存储）
- 单个 Key 自定义倍率（KeyMultiplier 表）
- Key 脱敏显示，支持备注

---

## 11. 落地页

参考 PDF 宣传物料风格：
- Hero 区域：品牌名 + 标语 + CTA 按钮
- 功能卡片：4 个 AI 应用介绍
- 使用流程：上传素材 → AI 生成 → 下载成果
- 页脚

---

## 12. 部署

### Docker Compose

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=changeme
      - DATABASE_URL=file:/data/app.db
    volumes:
      - app-data:/data
```

### 直接部署

```bash
pnpm install && pnpm build && pnpm start
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `ADMIN_USERNAME` | `admin` | 管理员用户名 |
| `ADMIN_PASSWORD` | `admin123` | 管理员密码 |
| `DATABASE_URL` | `file:./prisma/app.db` | SQLite 路径 |
| `JWT_SECRET` | 随机生成 | JWT 签名密钥 |
| `WEBHOOK_ENABLED` | `false` | 是否启用 Webhook |
| `MAX_UPLOAD_SIZE` | `10485760` | 上传大小限制 (bytes) |
| `MAX_CONCURRENT_TASKS` | `30` | 前端最大并发任务数 |

---

## 13. 开发资源提示

> **重要**：实现过程中涉及 RunningHub API 调用时，务必参考项目内的 `skills/runninghub-api-dev/` 知识库。
>
> 该 Skill 包含：
> - 完整的 API 文档本地替代（`references/` 目录）
> - 四个 AI 应用的真实验证记录（`references/15-ai-app-validation.md`）
> - API 元数据与 demo JSON（`assets/app-source-pages/`）
> - 可运行的联调脚本（`scripts/`）
> - 鉴权差异、上传回填、轮询策略等实测结论（`references/12-verified-findings.md`）
>
> 入口文件：`skills/runninghub-api-dev/SKILL.md`
>
> 优先从 Skill 获取信息，避免回官网查资料。
