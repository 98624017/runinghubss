# ComfyUI 工作流调用

## 先决条件

在写 API 代码之前，先确认：

1. 你已经拿到 `workflowId`
2. 该工作流在网页端至少成功运行过一次
3. 需要改参的字段能在工作流 / API JSON 中找到真实 `nodeId` 与 `fieldName`

## 两种调用方式

### 1. 简易模式

- 接口：`POST /task/openapi/create`
- 适合：不改任何参数，直接按网页默认配置运行

最小请求体通常只需要：

```json
{
  "apiKey": "your-api-key",
  "workflowId": "1904136902449209346"
}
```

### 2. 高级模式

- 接口：`POST /task/openapi/create`
- 适合：提交时动态修改节点参数

文档中的典型请求体：

```json
{
  "apiKey": "your-api-key",
  "workflowId": "1904136902449209346",
  "nodeInfoList": [
    {
      "nodeId": "6",
      "fieldName": "text",
      "fieldValue": "1 girl in classroom"
    },
    {
      "nodeId": "3",
      "fieldName": "seed",
      "fieldValue": "1231231"
    }
  ]
}
```

## `nodeInfoList` 的核心规则

每一项都表示“改某个节点的某个输入字段”：

- `nodeId`：节点编号
- `fieldName`：该节点输入字段名
- `fieldValue`：新的值

参考文档说明：

- 文本节点常见 `fieldName=text`
- 随机种子常见 `fieldName=seed`
- 图片输入常见 `fieldName=image`

## 快速定位 `nodeId / fieldName`

1. 打开工作流界面，记下节点右上角数字
2. 导出 / 查看 API 格式工作流 JSON
3. 在 JSON 中搜索这个节点编号
4. 在对应 `inputs` 中找到 key 名称，这个 key 就是 `fieldName`

## 高级参数

### `webhookUrl`

任务完成后，RunningHub 会主动 `POST` 回调。

典型回调：

```json
{
  "event": "TASK_END",
  "taskId": "1904163390028185602",
  "eventData": "{\"code\":0,\"msg\":\"success\",\"data\":[{\"fileUrl\":\"https://...png\",\"fileType\":\"png\",\"taskCostTime\":0,\"nodeId\":\"9\"}]}"
}
```

### `workflow`

- 可直接提交完整工作流 JSON 字符串
- 如果指定该字段，文档说明会忽略 `workflowId`

### `instanceType`

- 可指定实例类型
- 文档示例里出现过 `"plus"`

### `usePersonalQueue`

- 仅对独占类型 Key 生效
- 开启后会进入个人排队

## 返回结果

成功时通常会得到：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "taskId": "1904163390028185602"
  }
}
```

不同接口 / 场景下，`data` 中还可能附带：

- `netWssUrl`
- `clientId`
- `taskStatus`
- `promptTips`

## 开发建议

1. 把 `workflowId` 固化到配置层
2. 把 `nodeInfoList` 构造逻辑封装成函数
3. 对 `seed` 做显式控制，不要假设平台会保持原值
4. 对图片、音频、视频输入统一走上传→回填流程
5. 如果是产品环境，优先 webhook；如果是脚本联调，优先轮询
