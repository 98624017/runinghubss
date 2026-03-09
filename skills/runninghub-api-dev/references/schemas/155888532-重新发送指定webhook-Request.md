# 重新发送指定webhook Request

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888532.md`
- [官网明确] 页面编号：`155888532`
- [官网明确] Schema 名称：`重新发送指定webhook Request`

## 字段摘要

- [官网明确] `apiKey`：`string`
- [官网明确] `webhookId`：`string`
- [官网明确] `webhookUrl`：`string`

## 原始 Schema 归档

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths: {}
components:
  schemas:
    重新发送指定webhook Request:
      type: object
      properties:
        apiKey:
          type: string
          description: ''
          examples:
            - '{{apiKey}}'
        webhookId:
          type: string
          examples:
            - '1904154698688159745'
        webhookUrl:
          type: string
          description: ''
          examples:
            - https://your-webhook-url
      x-apifox-orders:
        - apiKey
        - webhookId
        - webhookUrl
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
