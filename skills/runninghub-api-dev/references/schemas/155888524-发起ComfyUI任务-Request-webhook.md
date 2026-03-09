# 发起ComfyUI任务 Request-webhook

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888524.md`
- [官网明确] 页面编号：`155888524`
- [官网明确] Schema 名称：`发起ComfyUI任务 Request-webhook`

## 字段摘要

- [官网明确] `workflowId`：`string`
- [官网明确] `apiKey`：`string`
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
    发起ComfyUI任务 Request-webhook:
      type: object
      properties:
        workflowId:
          type: string
          examples:
            - '1904136902449209346'
        apiKey:
          type: string
          description: ''
          examples:
            - '{{apiKey}}'
        webhookUrl:
          type: string
          description: ''
          examples:
            - https://your-webhook-url
      x-apifox-orders:
        - apiKey
        - workflowId
        - webhookUrl
      required:
        - workflowId
        - apiKey
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
