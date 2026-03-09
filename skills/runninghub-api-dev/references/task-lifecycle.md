# 任务状态、结果与 webhook

## 推荐时序

```text
校验账号
  ↓
准备上传资源（如需要）
  ↓
创建任务
  ↓
查询状态 / 等 webhook
  ↓
查询结果
```

## 查询任务状态

- 方法：`POST`
- 路径：`/task/openapi/status`

请求体：

```json
{
  "apiKey": "your-api-key",
  "taskId": "1904152026220003329"
}
```

文档中状态枚举：

- `QUEUED`
- `RUNNING`
- `FAILED`
- `SUCCESS`

### 已验证错误场景

2026-03-08 实测：

- `taskId=0`

```json
{
  "code": 301,
  "msg": "taskId must be positive",
  "data": null
}
```

- 不存在的正整数 `taskId`

```json
{
  "code": 807,
  "msg": "APIKEY_TASK_NOT_FOUND",
  "data": null
}
```

## 查询任务生成结果

- 方法：`POST`
- 路径：`/task/openapi/outputs`

成功示例：

```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "fileUrl": "https://...png",
      "fileType": "png",
      "taskCostTime": "83",
      "nodeId": "12",
      "consumeCoins": "17"
    }
  ]
}
```

### 非成功结果也要处理

文档给出了几种高频返回：

- `804 APIKEY_TASK_IS_RUNNING`
  - 任务还在运行，继续轮询
- `813 APIKEY_TASK_IS_QUEUED`
  - 任务在排队，继续等待
- `805 APIKEY_TASK_STATUS_ERROR`
  - 任务失败，可从 `data.failedReason` 读取详细错误

失败示例里可拿到：

- `node_name`
- `node_id`
- `exception_type`
- `exception_message`
- `traceback`

这对定位工作流节点问题很有帮助。

## V2 查询接口

文档还给出了：

- `POST /openapi/v2/query`

如果你在新项目里统一走较新接口，可以额外评估这一版，但不要在没有确认字段兼容性的前提下替换老轮询逻辑。

## webhook 使用建议

创建任务时传 `webhookUrl` 后，平台会在任务结束时回调。

处理建议：

1. 接口收到回调后先快速返回 200
2. 再异步解析 `eventData`
3. 做去重，避免平台重试造成重复消费
4. 将 `taskId` 作为幂等键
