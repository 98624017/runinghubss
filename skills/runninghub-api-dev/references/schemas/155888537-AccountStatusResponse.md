# AccountStatusResponse

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888537.md`
- [官网明确] 页面编号：`155888537`
- [官网明确] Schema 名称：`AccountStatusResponse`

## 字段摘要

- [官网明确] `remainCoins`：`integer`
- [官网明确] `currentTaskCounts`：`integer`

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
    AccountStatusResponse:
      type: object
      properties:
        remainCoins:
          type: integer
          description: ''
        currentTaskCounts:
          type: integer
          description: ''
      x-apifox-orders:
        - remainCoins
        - currentTaskCounts
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
