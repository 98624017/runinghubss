---
name: runninghub-api-dev
description: Use when integrating RunningHub APIs, replacing the official RunningHub developer docs locally, navigating RunningHub model families, building ComfyUI workflow or 快捷创作 clients, handling uploads, polling task status/results, wiring webhook callbacks, or debugging RunningHub API errors and nodeInfoList mismatches.
---

# RunningHub API 全量覆盖增强版

这是一个面向 Agent 与开发者的 RunningHub 本地知识库入口。

它不是“官网摘要”，而是把官网拆成了：

- **入口导航**
- **主题分册**
- **官网页本地替代页**
- **模型族总览**
- **覆盖矩阵**
- **真实验证记录**
- **可直接运行的联调脚本**

如果你的目标是**不回官网也能完成接入、查询、上传与排障**，从这里开始。

## 先从哪里看

### 1. 想快速判断接入路径

先读：

- `references/00-overview.md`
- `references/02-api-concepts.md`

适合：

- 不确定该走 ComfyUI、快捷创作，还是标准模型 API
- 不知道 `workflowId`、`webappId`、`quickCreateCode`、`nodeInfoList` 的区别

### 2. 想确认官网是否已经被本地覆盖

先读：

- `references/10-api-index.md`
- `references/11-api-matrix.md`

适合：

- 你想查某个官网页面本地落在哪个文件
- 你想确认某个 API / schema / 说明页是否已收录

### 3. 想直接写调用代码

按场景跳转：

- 账户与鉴权：`references/01-auth-and-account.md`
- ComfyUI 基础：`references/03-comfyui-workflow-basics.md`
- ComfyUI 高级：`references/04-comfyui-workflow-advanced.md`
- 快捷创作：`references/05-quick-create.md`
- 上传：`references/06-uploads.md`
- 任务状态 / 结果 / webhook：`references/07-task-status-results-webhook.md`
- 排障：`references/08-errors-and-debugging.md`
- 最佳实践：`references/09-best-practices.md`
- Python SDK：`references/13-python-sdk.md`
- Node SDK：`references/14-node-sdk.md`
- 四应用真实闭环：`references/15-ai-app-validation.md`

### 4. 想查某个模型族

直接去：

- `references/models/`

这里已经把官网里的标准模型 API 按家族聚合，例如：

- 海螺 AI
- 全能视频 S / V
- 可灵 2.5 / 2.6 / o1
- 万象 2.6
- Vidu
- 全能图片 / 全能图片 G
- seedream

### 5. 想找官网某一页的本地替代

直接去：

- 官方说明页本地版：`references/docs/`
- 官方接口页本地版：`references/endpoints/`
- 官方 Schema 页本地版：`references/schemas/`

这些文件会保留：

- 官方来源地址
- 页面 ID
- 结构化摘要
- 官网原文归档

## 推荐使用顺序

### 新项目接入

1. `references/00-overview.md`
2. `references/01-auth-and-account.md`
3. `references/02-api-concepts.md`
4. 按场景进入 `03` / `04` / `05`
5. 再读 `06`、`07`、`08`

### 线上问题排查

1. `references/08-errors-and-debugging.md`
2. `references/12-verified-findings.md`
3. 对应的 `references/endpoints/*.md`
4. 必要时再回看 `references/schemas/*.md`

### 某个官网页面查替代页

1. `references/10-api-index.md`
2. `references/11-api-matrix.md`
3. 对应本地 `docs/`、`endpoints/`、`schemas/`

## 真实验证入口

已知最有价值的实测结论，集中放在：

- `references/12-verified-findings.md`

当前至少已验证：

- 账户接口成功返回
- 上传接口成功返回
- 状态接口对非法 / 不存在 `taskId` 的行为
- 部分接口对 Header / Body 鉴权依赖的差异
- V2 查询接口的错误返回形状
- 四个页面型 AI 应用的真实闭环
- `1994388299756212225` 的 Python / Node 双 SDK 闭环
- `2023563076041183233` 在 `2k` 与 `1k` 档位下的余额差异

## 可直接运行的脚本

### 最小联调

- `scripts/check_account.sh`
- `scripts/upload_file.sh`
- `scripts/query_task.sh`
- `scripts/query_result.sh`

### 烟雾验证

- `scripts/smoke/check_headers.sh`
- `scripts/smoke/verify_upload_roundtrip.sh`

### 四应用真实验证

- `scripts/validate/run_python_app_validation.sh`
- `scripts/validate/run_node_app_validation.sh`
- `scripts/validate/build_validation_summary.py`

### 全量收集与重建

- `scripts/collect/build_inventory.py`
- `scripts/collect/sync_official_pages.py`
- `scripts/collect/sync_reference.py`

## 来源标记说明

本知识库中的关键结论都会尽量带来源标记：

- `[官网明确]`：官网原始信息
- `[真实验证]`：已用真实 API 调用验证
- `[交叉整理]`：来自多个官网页面的合并整理
- `[推断建议]`：工程实践建议，不等同于官方承诺

## 何时用这个 Skill

- 你要接入 RunningHub API
- 你要替代官网查开发资料
- 你要定位某个模型族或某个接口页
- 你要弄清 `nodeInfoList`、上传回填、轮询、webhook
- 你在处理 `APIKEY_*`、`TOKEN_INVALID`、`PARAMS_INVALID` 等错误

## 何时不要用这个 Skill

- 你只是在写提示词，不涉及 API 接入
- 你在调试 RunningHub 网页前端，而不是 OpenAPI
- 你要接的是别家的模型平台，而不是 RunningHub
