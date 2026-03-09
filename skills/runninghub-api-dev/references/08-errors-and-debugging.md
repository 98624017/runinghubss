# 错误码与排障路径

## 最高频错误码

- [官网明确] `301 PARAMS_INVALID`
- [官网明确] `380 WORKFLOW_NOT_EXISTS`
- [官网明确] `412 TOKEN_INVALID`
- [官网明确] `415 TASK_INSTANCE_MAXED`
- [官网明确] `801 APIKEY_UNSUPPORTED_FREE_USER`
- [官网明确] `802 APIKEY_UNAUTHORIZED`
- [官网明确] `803 APIKEY_INVALID_NODE_INFO`
- [官网明确] `804 APIKEY_TASK_IS_RUNNING`
- [官网明确] `805 APIKEY_TASK_STATUS_ERROR`
- [官网明确] `807 APIKEY_TASK_NOT_FOUND`
- [官网明确] `808 APIKEY_UPLOAD_FAILED`
- [官网明确] `809 APIKEY_FILE_SIZE_EXCEEDED`
- [官网明确] `813 APIKEY_TASK_IS_QUEUED`

## 最推荐的排障顺序

### 第一步：先查 URL

- [官网明确] `412 TOKEN_INVALID` 常见原因是接口路径拼错
- [交叉整理] 这类问题不是“密钥错”，而是“你请求了不存在的 API 地址”

### 第二步：再查账号与 Key

- [交叉整理] 优先跑账户接口
- [真实验证] 账户接口只传 Body 里的 `apikey` 就能成功
- [交叉整理] 如果账户接口都不通，后面所有任务接口都没有排查价值

### 第三步：再查业务前置

- [官网明确] 工作流是否存在
- [官网明确] 工作流是否网页端先跑通过一次

### 第四步：最后查 `nodeInfoList`

- [官网明确] `803 APIKEY_INVALID_NODE_INFO` 往往意味着：
  - `nodeId` 不对
  - `fieldName` 不对
  - `fieldValue` 类型不对

## 三个高发坑

### 1. 把 `download_url` 回填成任务输入

- [交叉整理] 正确做法一般是回填上传返回的 `fileName`

### 2. 忽略字段命名差异

- [官网明确] 有的接口要 `apikey`
- [官网明确] 有的接口要 `apiKey`

### 3. 把前端逻辑字段塞进 API

- [官网明确] 某些字段在 API 格式工作流中并不存在
- [交叉整理] 找不到就不要传

## 真实验证里发现的有用信号

- [真实验证] `accountStatus` 缺少 Body `apikey` 会报 `1601 param apiKey is required`
- [真实验证] `status` 接口对 `taskId=0` 会先报参数错误
- [真实验证] `status` 与 `outputs` 对不存在的正整数 `taskId` 会报 `807`
- [真实验证] `openapi/v2/query` 的错误结构与旧接口不一样

## 排障时该记录什么

- [推断建议] 至少记录：
  - 接口路径
  - `workflowId` / `webappId`
  - `taskId`
  - `code` / `msg`
  - `errorCode` / `errorMessage`
  - 失败时的 `failedReason`

- [推断建议] 不要把完整 API Key 打进日志
