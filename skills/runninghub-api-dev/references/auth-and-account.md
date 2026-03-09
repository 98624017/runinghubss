# 鉴权与账号校验

## 最小验证接口

最推荐的首个真实联调接口：

- 方法：`POST`
- 路径：`/uc/openapi/accountStatus`
- 完整地址：`https://www.runninghub.cn/uc/openapi/accountStatus`

原因：

- 只读
- 不创建任务
- 不需要 `workflowId`
- 不需要上传文件
- 能快速确认 API Key、账户权限、账户类型

## 鉴权规则

RunningHub 多数接口都建议同时传两处密钥：

1. Header

```http
Authorization: Bearer <RUNNINGHUB_API_KEY>
Host: www.runninghub.cn
Content-Type: application/json
```

2. Body

```json
{
  "apikey": "<RUNNINGHUB_API_KEY>"
}
```

或：

```json
{
  "apiKey": "<RUNNINGHUB_API_KEY>"
}
```

不同接口字段名大小写不完全一致：

- 账户接口常见 `apikey`
- 任务接口常见 `apiKey`

写请求前先核对文档示例。

## 已验证响应

2026-03-08 使用真实 API Key 验证成功，实际返回结构如下：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "remainCoins": "76600",
    "currentTaskCounts": "0",
    "remainMoney": null,
    "currency": null,
    "apiType": "NORMAL"
  }
}
```

可重点关注：

- `remainCoins`：剩余 RH 币
- `currentTaskCounts`：当前执行中的任务数
- `apiType`：账号 API 类型

## 最小 curl

```bash
curl -X POST 'https://www.runninghub.cn/uc/openapi/accountStatus' \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d "{\"apikey\":\"${RUNNINGHUB_API_KEY}\"}"
```

## 接入建议

1. 新项目接入时，先跑一次账户校验
2. 将 Key 放到环境变量 `RUNNINGHUB_API_KEY`
3. 业务日志里不要打印完整 Key
4. 任务流调用前，可用该接口做启动前自检

## 常见失败

- `801 APIKEY_UNSUPPORTED_FREE_USER`
  - 免费用户不支持 API
- `802 APIKEY_UNAUTHORIZED`
  - Key 无效、过期或被禁用
- `412 TOKEN_INVALID`
  - URL 路径写错
