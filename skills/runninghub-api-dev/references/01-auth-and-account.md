# 鉴权与账号校验

## 先记住结论

- [真实验证] `POST /uc/openapi/accountStatus` 可以作为首个最小联调接口。
- [真实验证] 对账户接口来说，**Body 里的 `apikey` 是必要的**；仅传 `Authorization` Header 不够。
- [真实验证] 仅传 Body 中的 `apikey`，不传 `Authorization` Header，也能成功返回账户信息。

## 推荐最小联调接口

- 方法：`POST`
- 路径：`/uc/openapi/accountStatus`
- 作用：
  - [官网明确] 校验账号是否支持 API
  - [官网明确] 返回账户类型、剩余 RH 币、当前任务数
  - [交叉整理] 这是最省资源、最适合第一步接通的接口

## 实际鉴权行为

### 官网写法

- [官网明确] 文档常写：
  - Header：`Authorization: Bearer <API_KEY>`
  - Body：`apikey` 或 `apiKey`

### 实测结果

- [真实验证] `accountStatus`：
  - Header + Body：成功
  - 仅 Header：失败，返回 `1601 param apiKey is required`
  - 仅 Body：成功

### 开发建议

- [交叉整理] 不要臆测“全站接口都只认 Header”
- [推断建议] 最稳妥的工程实践仍然是：**Header 与 Body 都按页面示例传**
- [交叉整理] 但若你遇到账户接口异常，优先检查 Body 是否带了 `apikey`

## 最小请求

```bash
curl -X POST 'https://www.runninghub.cn/uc/openapi/accountStatus' \
  -H 'Host: www.runninghub.cn' \
  -H 'Content-Type: application/json' \
  -d "{\"apikey\":\"${RUNNINGHUB_API_KEY}\"}"
```

## 已验证响应

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

## 关键字段怎么用

- `remainCoins`
  - [官网明确] 剩余 RH 币
  - [交叉整理] 可用来判断是否需要先充值或切企业模式
- `currentTaskCounts`
  - [官网明确] 当前运行中的任务数
  - [交叉整理] 可作为并发占用观察指标
- `apiType`
  - [官网明确] API 类型
  - [真实验证] 当前实测账号返回 `NORMAL`

## 常见失败

- `801 APIKEY_UNSUPPORTED_FREE_USER`
  - [官网明确] 免费用户不支持 API
- `802 APIKEY_UNAUTHORIZED`
  - [官网明确] API Key 无效或失效
- `1601 param apiKey is required`
  - [真实验证] 账户接口缺少 Body 中的 `apikey`

## 推荐检查顺序

1. [交叉整理] 先跑账户接口
2. [交叉整理] 成功后再测上传或任务接口
3. [交叉整理] 如果账户接口都不通，不要继续调任务链路
