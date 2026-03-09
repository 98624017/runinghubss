# TaskUploadResponse

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888542.md`
- [官网明确] 页面编号：`155888542`
- [官网明确] Schema 名称：`TaskUploadResponse`

## 字段摘要

- [官网明确] `fileName`：`string`
- [官网明确] `fileType`：`string`

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
    TaskUploadResponse:
      type: object
      properties:
        fileName:
          type: string
          description: ''
        fileType:
          type: string
          description: ''
      x-apifox-orders:
        - fileName
        - fileType
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
