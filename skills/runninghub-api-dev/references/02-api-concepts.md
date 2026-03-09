# 核心概念与参数来源

## 最容易混淆的几个概念

### `workflowId`

- [官网明确] ComfyUI 工作流模板 ID
- [官网明确] 可从 RunningHub 工作流页面获取
- [交叉整理] 你要走 `/task/openapi/create` 时，通常需要它

### `webappId`

- [官网明确] 快捷创作应用 ID
- [官网明确] 通常从快捷创作模块页面的 API 示例中获取
- [交叉整理] 你要走 `/task/openapi/quick-ai-app/run` 时，通常需要它

### `quickCreateCode`

- [官网明确] 快捷创作模块代码
- [交叉整理] 这不是让你手写猜出来的，应该从页面“调用 API”示例拿

### `taskId`

- [官网明确] 任务创建后返回的唯一任务 ID
- [交叉整理] 后续状态查询、结果查询、webhook 去重都会依赖它

### `nodeInfoList`

- [官网明确] 动态改参列表
- [交叉整理] 它是 RunningHub 接入里最核心、也最容易错的结构之一

## `nodeInfoList` 到底是什么

一个典型项通常长这样：

```json
{
  "nodeId": "6",
  "fieldName": "text",
  "fieldValue": "1 girl in classroom"
}
```

含义：

- `nodeId`
  - [官网明确] 节点编号
- `fieldName`
  - [官网明确] 节点输入字段名
- `fieldValue`
  - [官网明确] 新值

## `nodeInfoList` 的参数从哪来

1. [官网明确] 在工作流界面看节点右上角数字，拿到 `nodeId`
2. [官网明确] 在 API 格式工作流 JSON 的 `inputs` 里找到对应字段名，拿到 `fieldName`
3. [交叉整理] 再把你自己的实际输入写到 `fieldValue`

## 上传后到底填什么

- [官网明确] 上传接口会返回：
  - `download_url`
  - `fileName`
- [交叉整理] 任务接口里通常应该回填 `fileName`
- [真实验证] 上传接口确实会返回带签名的 `download_url` 和稳定的 `fileName`
- [推断建议] 不要把 `download_url` 当成任务输入的主字段，优先用 `fileName`

## 常见字段命名差异

- [官网明确] 有的接口用 `apikey`
- [官网明确] 有的接口用 `apiKey`
- [交叉整理] 这是 RunningHub 接口的一处不统一点
- [推断建议] 写 SDK 时不要硬编码一个统一字段名，应该按接口页面区分

## 接入路径决策树

### 你已经有 `workflowId`

- [交叉整理] 走 ComfyUI 工作流 API

### 你只有快捷创作模块页面

- [交叉整理] 走快捷创作 API

### 你已经确定要打某个标准模型端点

- [交叉整理] 先看 `references/models/`，再进入对应 `references/endpoints/*.md`

## 最后一个关键前置

- [官网明确] 目标工作流必须先在网页端成功运行过至少一次
- [交叉整理] 如果这一步没做，即使请求格式没错，也可能出现“看似莫名其妙”的失败
