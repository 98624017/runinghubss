# 发起ComfyUI任务 Request 1

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888522.md`
- [官网明确] 页面编号：`155888522`
- [官网明确] Schema 名称：`发起ComfyUI任务 Request 1`

## 字段摘要

- [官网明确] `workflowId`：`string`
- [官网明确] `apiKey`：`string`
- [官网明确] `addMetadata`：`boolean`

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
    发起ComfyUI任务 Request 1:
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
        addMetadata:
          type: boolean
          description: ''
      x-apifox-orders:
        - apiKey
        - workflowId
        - addMetadata
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
