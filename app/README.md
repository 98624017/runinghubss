# 白牌 AI 应用平台

> **当前说明以本页前半部分为准。** 下方保留的 RunningHub 联调记录仅作为上游排障存档，不代表前台产品文案。

一个基于 `React + Vite + Node/Express + PostgreSQL` 的白牌 AI 应用平台：

- 前台提供品牌首页、应用列表、动态工作区与历史记录
- 后台提供登录、应用管理、Schema 编排与任务检索
- 服务端统一提供 `/api/*`、前台静态站点、`/health`、`/ready`
- 首期部署形态保持简单：`Node API + PostgreSQL`

## 当前交付

- 白牌前台页面已去除真实上游品牌文案
- AI 应用支持后台配置总体超时时间
- 前端工作区由后台已发布 schema 驱动
- 服务端支持历史记录、后台任务检索与静态托管
- 可通过 `Dockerfile`、`docker-compose.yml`、`.env.example` 直接部署

## 快速开始

```bash
cp ../.env.example ../.env
cd app
npm ci
npm run dev
```

如果只跑生产形态：

```bash
cd app
npm run build
npm run prod:start
```

## 常用命令

- 本地开发：`cd app && npm run dev`
- 前端测试：`cd app && timeout 60s npm run test --workspace client`
- 服务端测试：`cd app && timeout 60s npm run test --workspace server`
- 全量测试：`cd app && timeout 60s npm run test`
- 生产构建：`cd app && timeout 60s npm run build`
- 真实网页 smoke：`cd app && RUNNINGHUB_E2E_API_KEY=*** npm run test:e2e`

## 环境变量

部署最少需要：

- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_DEFAULT_USERNAME`
- `ADMIN_DEFAULT_PASSWORD`

可选：

- `PORT`，默认 `8787`
- `ADMIN_PATH`，当前保留为部署层配置项

完整样例见仓库根目录 `.env.example`。

## 探活与部署

- 健康检查：`GET /health`
- 就绪检查：`GET /ready`
- 兼容保留：`GET /api/health`

部署说明见 `deploy/README.md`。

## 历史联调存档

以下内容为早期上游联调记录，保留供研发排障参考：

## 1. 当前覆盖的 RunningHub AI 应用

### `2011111632956563457`

- 名称：`通用高清放大-极速-自用`
- 节点映射：
  - `308:image`
  - `306:value(Boolean)`
- 表单能力：
  - 上传单张图片
  - 可选开启 `8K`

### `1993737411698032641`

- 名称：`心宝-全能图片Pro+Seedvr2.5超分高清放大`
- 节点映射：
  - `22:image`
  - `43:text`
- 表单能力：
  - 上传单张图片
  - 输入中文增强提示词

### `1994388299756212225`

- 名称：`室内设计平面图填色-立体版`
- 节点映射：
  - `257:image`
  - `253:text`
  - `260:width`
  - `260:height`
- 表单能力：
  - 上传单张平面白图
  - 使用预置或自定义立体化提示词
  - 调整输出宽高

### `1986819253754130433`

- 名称：`Missa_建筑景观_风格迁移_效果图专用`
- 节点映射：
  - `1:image`
  - `403:image`
- 表单能力：
  - 上传原始图像
  - 上传风格参考图
  - 不需要 prompt

## 2. 技术栈

- 前端：`React 19` + `Vite`
- 后端：`Express 5` + `multer`
- 测试：`Vitest`
- 风格：`Windows 11 / Fluent 2`

## 3. 目录结构

```text
app/
├── client/                 # React 前端
├── server/                 # Express 后端
└── package.json            # workspace 脚本入口
```

## 4. 快速启动

### 安装依赖

```bash
cd app
npm install
```

### 启动开发环境

```bash
cd app
npm run dev
```

默认情况下：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8787`

如果 `5173` 已被占用，Vite 会自动顺延到 `5174`、`5175` 等端口。

### 分开启动

```bash
cd app
npm run dev:server
```

```bash
cd app
npm run dev:client
```

## 5. 构建与测试

### 运行测试

```bash
cd app
npm run test
```

### 生产构建

```bash
cd app
npm run build
```

### 网页 E2E 回归

```bash
cd app
RUNNINGHUB_E2E_API_KEY=你的key npm run test:e2e
```

默认会：

- 自动先执行 `npm run build`
- 启动构建后的后端
- 启动前端 `vite preview`
- 真实打开页面
- 跑完当前网页真机回归覆盖的两个应用
- 输出截图与 `summary.json`

产物默认输出到：

- `app/e2e/artifacts/latest/`

## 6. 环境变量

### 前端

前端默认请求：

```text
http://localhost:8787
```

如需改成别的后端地址，可设置：

```bash
VITE_API_BASE_URL=http://localhost:8787
```

### 后端

后端默认端口：

```bash
PORT=8787
```

## 7. 使用方式

1. 打开前端页面
2. 页面会先从后端读取 `/api/apps` 动态应用清单
3. 页面会根据 `/api/apps` 返回的 `fields` 动态渲染表单
4. 输入你自己的 RunningHub API Key
5. 点击“检查账户”确认连通性
6. 选择应用
7. 上传图片
8. 按需填写动态字段：
   - 布尔开关会渲染为 Fluent 风格切换控件
   - 文本字段会渲染为文本框，并支持预置提示词按钮
9. 点击“运行当前应用”
10. 等待自动轮询完成
11. 在右侧查看：
   - 任务状态
   - 输出结果
   - 调试信息
12. 结果卡支持：
   - `下载结果`
   - `复制链接`
   - `打开原图`

## 8. 真实联调结论

截至 `2026-03-08`，本控制台已基于真实 RunningHub 账户完成以下验证：

- 页面内账户检查：成功
- 页面内 `2011111632956563457` 提交：成功拿到真实 `taskId`
- 网站后端 `2011111632956563457` 闭环：成功
- 网站后端 `1993737411698032641` 闭环：成功
- 正式落库的 `npm run test:e2e`：成功
- `1994388299756212225` 与 `1986819253754130433` 已完成字段接入、路由接入与自动化测试
- 上述两款新增应用的网页真机 E2E 仍可继续扩展，本轮尚未纳入 `test:e2e`

详细记录见：

- `docs/validation/2026-03-08-runninghub-ai-console-validation.md`
- `app/e2e/README.md`

## 9. 与 Skill 的关系

本项目不是脱离 Skill 手写的一套文档或节点猜测，而是以这些内容为准：

- `skills/runninghub-api-dev/SKILL.md`
- `skills/runninghub-api-dev/references/12-verified-findings.md`
- `skills/runninghub-api-dev/references/13-python-sdk.md`
- `skills/runninghub-api-dev/references/14-node-sdk.md`
- `skills/runninghub-api-dev/references/15-ai-app-validation.md`

测试素材也优先复用 Skill 内资产，例如：

- `skills/runninghub-api-dev/assets/test-inputs/livingroom-green-sofa-pexels.jpg`

## 10. 常见问题

### `Outdated Optimize Dep`

如果前端开发态出现 Vite 依赖缓存过期，可以强制重建：

```bash
cd app
npm run dev --workspace client -- --force
```

### 任务长时间处于运行中

- 打开页面里的调试抽屉
- 查看 `/status` 与 `/result` 的原始返回
- 核对 RunningHub 是否返回：
  - `APIKEY_TASK_IS_RUNNING`
  - `APIKEY_TASK_NOT_FOUND`
  - 第三方余额不足相关提示

### 页面不保存 API Key 吗？

当前实现只在本次调用中使用 API Key：

- 前端不做持久化保存
- 后端错误与调试信息会脱敏

### `npm run test:e2e` 需要什么前置条件？

- 本机可用的 Chrome / Chromium
- 真实 `RUNNINGHUB_E2E_API_KEY`
- 默认公开测试图存在于：
  - `skills/runninghub-api-dev/assets/test-inputs/`

如果浏览器路径不是默认位置，可设置：

```bash
RUNNINGHUB_E2E_BROWSER_PATH=/path/to/chrome
```

## 11. 后续可扩展方向

- 继续扩展更多 RunningHub 应用的字段定义，复用现有动态表单
- 增加更细的状态文案与错误分类
- 增加结果链接复制成功/失败的分层提示
- 把 E2E 回归接入长期 CI 或定时人工巡检
