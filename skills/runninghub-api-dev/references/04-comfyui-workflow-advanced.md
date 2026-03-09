# ComfyUI 工作流高级调用

## 高级模式解决什么问题

- [官网明确] 通过 `nodeInfoList` 在提交任务前替换默认参数
- [交叉整理] 这是把网页工作流变成程序化 API 能力的关键

## 高级请求体典型结构

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

## `nodeInfoList` 高风险点

### 1. `nodeId` 填错

- [官网明确] 节点编号必须对应工作流真实节点
- [官网明确] 填错常见报错：`803 APIKEY_INVALID_NODE_INFO`

### 2. `fieldName` 填错

- [官网明确] 必须与 API 格式工作流中该节点的 `inputs` key 一致

### 3. `fieldValue` 类型不匹配

- [交叉整理] 有些字段是字符串，有些是整型、布尔型或资源路径

### 4. 改了前端专属字段

- [官网明确] 某些前端逻辑字段在 API 中不可用
- [交叉整理] 如果 API 格式工作流中找不到对应字段，就别强行传

## 官方特别提醒

- [官网明确] API 调用会强制重置 `seed`
- [交叉整理] 如果你要保持种子值，必须显式把 `seed` 放进 `nodeInfoList`

## 高级可选参数

### `webhookUrl`

- [官网明确] 任务完成后平台会主动回调
- [交叉整理] 适合生产环境异步处理

### `workflow`

- [官网明确] 可以直接传完整工作流 JSON 字符串
- [官网明确] 指定后会忽略 `workflowId`

### `instanceType`

- [官网明确] 可指定实例类型

### `usePersonalQueue`

- [官网明确] 仅对独占类型 API Key 生效

## 高级模式推荐顺序

1. [交叉整理] 先用基础模式跑通
2. [交叉整理] 再只改一个字段验证
3. [交叉整理] 最后逐步扩大到完整 `nodeInfoList`

## 开发建议

- [推断建议] 为 `nodeInfoList` 构造做独立函数，不要散落在业务逻辑里
- [推断建议] 对 `fieldName`、`nodeId` 做静态配置，避免线上手拼
- [推断建议] 对高频资源字段统一封装上传 → 回填流程
