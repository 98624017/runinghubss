# WorkflowDuplicateRequest

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888538.md`
- [官网明确] 页面编号：`155888538`
- [官网明确] Schema 名称：`WorkflowDuplicateRequest`

## 字段摘要

- [官网明确] `apiKey`：`string`
- [官网明确] `workflowId`：`string`

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
    WorkflowDuplicateRequest:
      type: object
      properties:
        apiKey:
          type: string
          description: ''
          examples:
            - '{{apiKey}}'
        workflowId:
          type: string
          examples:
            - '1904136902449209346'
      x-apifox-orders:
        - apiKey
        - workflowId
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
