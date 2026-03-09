# 错误码与排障

## 高优先级错误码

这些错误最值得优先处理：

- `301 PARAMS_INVALID`
  - 缺参数、类型不对、字段名不对
- `380 WORKFLOW_NOT_EXISTS`
  - `workflowId` 无效
- `412 TOKEN_INVALID`
  - URL 路径拼错
- `415 TASK_INSTANCE_MAXED`
  - 独占型机器暂时不足
- `801 APIKEY_UNSUPPORTED_FREE_USER`
  - 免费用户不支持 API
- `802 APIKEY_UNAUTHORIZED`
  - API Key 无效或失效
- `803 APIKEY_INVALID_NODE_INFO`
  - `nodeInfoList` 与工作流不匹配
- `804 APIKEY_TASK_IS_RUNNING`
  - 任务仍在运行
- `805 APIKEY_TASK_STATUS_ERROR`
  - 任务异常，可继续看失败详情
- `807 APIKEY_TASK_NOT_FOUND`
  - `taskId` 不存在
- `808 APIKEY_UPLOAD_FAILED`
  - 上传失败
- `809 APIKEY_FILE_SIZE_EXCEEDED`
  - 文件过大
- `813 APIKEY_TASK_IS_QUEUED`
  - 已排队

## 最高频排查顺序

1. **先查 URL**
   - `412 TOKEN_INVALID` 通常不是鉴权问题，而是接口路径错误

2. **再查 Key**
   - 用账户接口验证是否能成功返回 `code: 0`

3. **再查工作流前提**
   - 工作流是否存在
   - 是否网页端先跑通过一次

4. **最后查 `nodeInfoList`**
   - `nodeId` 对不对
   - `fieldName` 对不对
   - `fieldValue` 类型对不对

## `nodeInfoList` 排查技巧

文档给出的关键提醒：

1. API 调用会强制重置 `seed`
   - 如果你想保持种子值，必须显式把 `seed` 放进 `nodeInfoList`

2. 某些字段属于前端逻辑
   - 在 API 格式工作流里找不到，就不要硬传

3. `fieldValue` 如果是 `[]` 包裹的连线结构
   - 一般不建议修改

## 失败时该记录什么

为方便二次排障，建议日志里至少记录：

- 请求 URL
- `workflowId` / `webappId`
- `taskId`
- `code`
- `msg`
- 失败时的 `failedReason.exception_message`
- 失败时的 `failedReason.node_name`

不要记录完整 API Key。
