# 悦安居 — AI 家装效果图生成平台

基于 RunningHub API 的 AI 家装设计图生成平台，支持一键彩平、外观迁移、平面转效果图、毛坯转效果图等功能。

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS + shadcn/ui
- **后端**: Next.js API Routes + Prisma + SQLite
- **状态管理**: Zustand + IndexedDB (Dexie.js)
- **认证**: JWT (jose)
- **部署**: Docker + Docker Compose

## 快速开始

### 开发环境

```bash
# 安装依赖
pnpm install

# 初始化数据库
pnpm prisma migrate dev
pnpm prisma db seed

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### Docker 部署（本地/测试）

```bash
# 复制环境变量
cp .env.example .env

# 修改 .env 中的配置（特别是 JWT_SECRET 和 ADMIN_PASSWORD）

# 构建并启动
docker compose up -d
```

容器启动时会自动执行数据库迁移（`prisma migrate deploy`）和初始数据填充（`prisma db seed`）。
迁移失败会中止启动，seed 失败仅记录日志不影响启动。

### 生产部署（带 HTTPS）

项目提供了 `deploy/` 目录用于生产环境部署，包含 Caddy 反向代理（自动 HTTPS）：

```bash
cd deploy

# 复制并编辑环境变量
cp env.production.example .env
# 必须修改：DOMAIN、ADMIN_PASSWORD、JWT_SECRET

# 启动
docker compose -f docker-compose.prod.yml up -d
```

**持久化卷说明：**

| 路径 | 用途 | 必须持久化 |
|------|------|-----------|
| `/data` | SQLite 数据库文件 | 是 |
| `/app/public/images/covers` | 后台上传的应用封面图 | 建议 |

> **Zeabur / 自托管平台**：设置环境变量后直接从 Dockerfile 构建即可。
> 确保 `DATABASE_URL` 指向持久化存储路径（如 `file:/data/app.db`），
> 并将 `/data` 目录挂载到持久卷。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | SQLite 数据库路径 | `file:./dev.db`（开发）/ `file:/data/app.db`（生产） |
| `ADMIN_USERNAME` | 管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码 | `admin123` |
| `JWT_SECRET` | JWT 签名密钥（**生产环境必填，否则启动报错**） | 开发环境有内置默认值 |
| `WEBHOOK_ENABLED` | 是否启用 Webhook | `false` |
| `MAX_UPLOAD_SIZE` | 最大上传大小 (bytes) | `10485760` (10MB) |
| `MAX_CONCURRENT_TASKS` | 最大并发任务数 | `30` |

> 生成 JWT_SECRET：`openssl rand -hex 32`

## 后台管理

访问 `/admin/login`，使用环境变量中配置的管理员账号登录。

功能：
- 应用管理（CRUD、从 curl 导入字段配置）
- Key 倍率管理
- 系统设置

## 添加新 AI 应用

1. 登录后台 → 应用管理 → 新建应用
2. 填写应用名称、RunningHub App ID
3. 使用"从 curl 导入"功能粘贴 RunningHub 的 curl 命令，自动解析字段
4. 调整字段配置（类型、标签、是否必填等）
5. 保存并启用

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/             # API 路由
│   │   ├── admin/       # 后台 API（需 JWT）
│   │   ├── apps/        # 公开应用 API
│   │   ├── task/        # 任务代理 API
│   │   ├── upload/      # 文件上传代理
│   │   └── webhook/     # Webhook 回调
│   ├── admin/           # 后台页面
│   ├── workspace/       # 工作台
│   ├── history/         # 历史记录
│   └── settings/        # 用户设置
├── components/          # React 组件
│   ├── admin/           # 后台组件
│   ├── history/         # 历史组件
│   ├── landing/         # 落地页组件
│   ├── layout/          # 布局组件
│   ├── ui/              # shadcn/ui
│   └── workspace/       # 工作台组件
├── lib/                 # 工具库
│   ├── runninghub/      # RunningHub API 客户端
│   ├── schemas/         # Zod 校验
│   ├── stores/          # Zustand 状态
│   └── utils/           # 工具函数
└── prisma/              # 数据库
```
