# 获取工作流Json Request

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888520.md`
- [官网明确] 页面编号：`155888520`
- [官网明确] Schema 名称：`获取工作流Json Request`

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
    获取工作流Json Request:
      type: object
      properties:
        apiKey:
          type: string
          x-apifox-mock: '{{apiKey}}'
          description: ''
          examples:
            - '{{apiKey}}'
        workflowId:
          type: string
          x-apifox-mock: '1904136902449209346'
          examples:
            - '1904136902449209346'
      x-apifox-orders:
        - apiKey
        - workflowId
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
