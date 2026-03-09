# 真实验证记录

## 说明

- [真实验证] 本页只记录已经用真实 API 请求验证过的事实
- [交叉整理] 未出现在本页的结论，不代表错误，只代表“尚未进入实测层”

## 2026-03-08：账户接口

### 请求

- 接口：`POST /uc/openapi/accountStatus`

### 结果

- [真实验证] Header + Body：成功
- [真实验证] 仅 Header：失败，`1601 param apiKey is required`
- [真实验证] 仅 Body：成功

### 结论

- [真实验证] 对账户接口来说，Body 里的 `apikey` 是必需条件
- [推断建议] 工程上仍建议 Header 与 Body 都按示例传，避免后续接口差异踩坑

## 2026-03-08：账户接口成功响应

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

## 2026-03-08：上传接口

### 请求

- 接口：`POST /openapi/v2/media/upload/binary`
- 输入：1×1 PNG

### 结果

- [真实验证] 返回 `code: 0`
- [真实验证] 返回了：
  - `data.type=image`
  - `data.fileName`
  - `data.size`
  - `data.download_url`

### 结论

- [真实验证] 上传接口可作为第二步最小联调验证
- [交叉整理] `fileName` 是后续任务回填时最关键的字段

## 2026-03-08：状态接口

### 请求 1

- 接口：`POST /task/openapi/status`
- 参数：`taskId=0`

### 结果 1

- [真实验证] 返回：

```json
{
  "code": 301,
  "msg": "taskId must be positive",
  "data": null
}
```

### 请求 2

- 接口：`POST /task/openapi/status`
- 参数：不存在的正整数 `taskId`

### 结果 2

- [真实验证] 仅 Body `apiKey`：`807 APIKEY_TASK_NOT_FOUND`
- [真实验证] 仅 Header：`301 must not be blank`

### 结论

- [真实验证] 状态接口同样强依赖 Body 中的 `apiKey`
- [交叉整理] 仅靠 Authorization Header 不能稳定替代 Body 参数

## 2026-03-08：结果接口

### 请求

- 接口：`POST /task/openapi/outputs`
- 参数：不存在的正整数 `taskId`

### 结果

- [真实验证] 返回：

```json
{
  "code": 807,
  "msg": "APIKEY_TASK_NOT_FOUND",
  "data": null
}
```

### 结论

- [真实验证] 结果接口对不存在任务会给出明确的 `807`

## 2026-03-08：V2 查询接口

### 请求

- 接口：`POST /openapi/v2/query`
- 参数：不存在的正整数 `taskId`

### 结果

- [真实验证] 带鉴权时返回结构为：
  - `taskId`
  - `status`
  - `errorCode`
  - `errorMessage`
  - `results`
  - `clientId`
  - `promptTips`
  - `failedReason`
  - `usage`

- [真实验证] 不带鉴权时返回：

```json
{
  "code": 412,
  "msg": "TOKEN_INVALID"
}
```

### 结论

- [真实验证] V2 查询接口的错误结构与旧版 `code/msg/data` 风格不同
- [交叉整理] 如果你要同时支持 V1 / V2 查询，需要在解析层做分流

## 2026-03-08：AI 应用 demo 接口

### 请求

- 接口：`GET /api/webapp/apiCallDemo`
- 输入：真实 `webappId`

### 结果

- [真实验证] 四个目标 AI 应用都可通过该接口拿到 `nodeInfoList`
- [真实验证] 这四个页面型 AI 应用都可以直接用 `webappId + nodeInfoList` 调 `POST /task/openapi/ai-app/run`
- [真实验证] 当前公开 demo 数据中未发现可直接依赖的 `quickCreateCode`

### 结论

- [真实验证] 对页面型 AI 应用接入来说，`apiCallDemo` 是最关键的模板接口
- [交叉整理] 如果你要替代官网“API调用示例”，优先缓存 demo JSON，而不是依赖网页按钮行为

## 2026-03-08：四个 AI 应用真实闭环

### 验证范围

- `1994388299756212225` 室内设计平面图填色-立体版
- `1986819253754130433` Missa_建筑景观_风格迁移_效果图专用
- `2003678561775067138` 🍌香蕉 2 & Pro9图任意融合
- `2023563076041183233` 毛坯房出图-全能版

### 结果

- [真实验证] `1994388299756212225`
  - Python `taskId=2030465625113104385`
  - Node `taskId=2030466545649590273`
  - 都成功返回输出
- [真实验证] `1986819253754130433`
  - Python `taskId=2030472866847399938`
  - 成功返回 `2` 个输出
- [真实验证] `2003678561775067138`
  - Python `taskId=2030466557397835777`
  - 使用 `9` 张图 + `1` 条 prompt 成功返回输出
- [真实验证] `2023563076041183233`
  - Python `taskId=2030475511414792193`
  - 使用 `2` 张图 + 文本 + LIST 参数成功返回输出

### 结论

- [真实验证] 这四个 AI 应用都能在本地 SDK 封装下跑通真实闭环
- [真实验证] `2003678561775067138` 的公开模板确实是 9 图版，而不是 2 图版
- [交叉整理] `1994388299756212225` 适合作为 Python / Node 双 SDK 的低门槛 smoke case

## 2026-03-08：`2023563076041183233` 分辨率与余额约束

### 请求

- 接口：`POST /task/openapi/ai-app/run`
- 应用：`2023563076041183233`
- 对比参数：
  - 官方默认 `605:resolution=2k`
  - 验证覆盖 `605:resolution=1k`

### 结果

- [真实验证] `2k` 时返回 `code=433`
- [真实验证] 错误消息核心为“Your API balance is insufficient”
- [真实验证] 保持其他参数不变，仅改成 `1k` 后即可成功提交并完成

### 结论

- [真实验证] 该应用的可用性不仅取决于 `remainCoins`，也受第三方 API 余额约束
- [推断建议] 做自动化验证时，最好允许 manifest 对 LIST 节点做账户级覆盖
- [推断建议] 若账户没有第三方余额，优先从较低分辨率开始验证
