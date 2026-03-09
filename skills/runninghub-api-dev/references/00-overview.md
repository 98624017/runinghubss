# RunningHub API 全景入口

## 这套知识库解决什么问题

- [交叉整理] 官网信息是按页面散落的，这里把它整理成“接入路径 + 主题分册 + 逐页替代页 + 实测记录”。
- [交叉整理] 目标不是摘要官网，而是让开发者在不打开官网的情况下也能完成接入。

## 三条主要接入路径

### 1. ComfyUI 工作流 API

- [官网明确] 典型接口：`POST /task/openapi/create`
- [官网明确] 关键前置：已有 `workflowId`
- [官网明确] 适合：你已经在 RunningHub 平台维护自己的工作流
- [交叉整理] 优点：控制力最强，适合长期产品化

### 2. 快捷创作 API

- [官网明确] 典型接口：`POST /task/openapi/quick-ai-app/run`
- [官网明确] 关键前置：已有 `webappId`、`quickCreateCode`
- [官网明确] 适合：复用平台现成模块页能力
- [交叉整理] 优点：页面里能直接拿示例，接入速度快

### 3. 标准模型 API

- [官网明确] 官网当前收录了大量标准模型端点，覆盖视频与图片生成多个模型族。
- [交叉整理] 适合：你明确知道要调用某个具体模型，不依赖工作流页面。
- [交叉整理] 建议先看 `references/models/` 再进入对应 `references/endpoints/*.md`

## 推荐接入顺序

1. [交叉整理] 先做账号可用性检查
2. [交叉整理] 再确认你走哪条接入路径
3. [交叉整理] 如果涉及文件输入，先打上传接口
4. [交叉整理] 再发起任务
5. [交叉整理] 最后处理状态轮询、结果查询或 webhook

## 最小联调路径

### 最稳妥起步

1. `scripts/check_account.sh`
2. `scripts/smoke/check_headers.sh`
3. `scripts/upload_file.sh`
4. `scripts/smoke/verify_upload_roundtrip.sh`

### 进入任务链路前

- [官网明确] 如果你走 ComfyUI 工作流，目标工作流必须先在网页端成功跑过至少一次。
- [交叉整理] 如果你还没确认参数来源，不要急着调任务接口，先看 `references/02-api-concepts.md`

## 你应该先读哪些文件

- 账户与鉴权：`references/01-auth-and-account.md`
- 核心概念：`references/02-api-concepts.md`
- 工作流基础：`references/03-comfyui-workflow-basics.md`
- 工作流高级能力：`references/04-comfyui-workflow-advanced.md`
- 快捷创作：`references/05-quick-create.md`
- 上传：`references/06-uploads.md`
- 任务生命周期：`references/07-task-status-results-webhook.md`
- 排障：`references/08-errors-and-debugging.md`
- 最佳实践：`references/09-best-practices.md`
- 实测结论：`references/12-verified-findings.md`

## 什么时候查逐页替代页

- [交叉整理] 当你想看官网某一页的“本地等价物”时，去 `references/docs/`、`references/endpoints/`、`references/schemas/`
- [交叉整理] 当你不确定有没有漏页时，去 `references/10-api-index.md` 与 `references/11-api-matrix.md`
