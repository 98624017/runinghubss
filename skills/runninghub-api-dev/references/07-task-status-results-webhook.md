# 任务状态、结果与 webhook

## 任务生命周期

```text
校验账号
  ↓
上传资源（如需要）
  ↓
创建任务
  ↓
查状态 / 等 webhook
  ↓
查结果
```

## 查询状态

- [官网明确] 接口：`POST /task/openapi/status`

### 已验证行为

- [真实验证] `taskId=0` 返回：

```json
{
  "code": 301,
  "msg": "taskId must be positive",
  "data": null
}
```

- [真实验证] 不存在的正整数 `taskId` 返回：

```json
{
  "code": 807,
  "msg": "APIKEY_TASK_NOT_FOUND",
  "data": null
}
```

### 鉴权差异

- [真实验证] 对状态接口来说：
  - 仅 Header，不传 Body 中 `apiKey`，在正整数不存在任务场景下返回 `301 must not be blank`
  - 仅 Body 中 `apiKey`，可以返回 `807 APIKEY_TASK_NOT_FOUND`
- [交叉整理] 这说明状态接口更依赖 Body 中的 `apiKey`

## 查询结果

- [官网明确] 接口：`POST /task/openapi/outputs`

### 官网成功结构

- [官网明确] 成功时 `data` 通常是结果数组
- [官网明确] 元素中常见字段：
  - `fileUrl`
  - `fileType`
  - `taskCostTime`
  - `nodeId`
  - `consumeCoins`

### 已验证行为

- [真实验证] 对不存在的正整数 `taskId`，返回：

```json
{
  "code": 807,
  "msg": "APIKEY_TASK_NOT_FOUND",
  "data": null
}
```

## V2 查询接口

- [官网明确] 接口：`POST /openapi/v2/query`

### 已验证行为

- [真实验证] 带 Authorization Header 查询不存在任务时，返回结构不是 `code/msg/data`，而是：
  - `taskId`
  - `status`
  - `errorCode`
  - `errorMessage`
  - `results`
  - `clientId`
  - `promptTips`
  - `failedReason`
  - `usage`

- [真实验证] 不带鉴权时，返回：

```json
{
  "code": 412,
  "msg": "TOKEN_INVALID"
}
```

## webhook

- [官网明确] 创建任务时可传 `webhookUrl`
- [官网明确] 任务完成后会回调 `TASK_END`
- [官网明确] `eventData` 会携带类似结果查询接口的数据

## 工程建议

- [交叉整理] 调试阶段优先轮询，生产环境优先 webhook
- [推断建议] webhook 接口收到请求后应尽快返回 200，再异步处理
- [推断建议] 用 `taskId` 做幂等键，避免重试导致重复消费
