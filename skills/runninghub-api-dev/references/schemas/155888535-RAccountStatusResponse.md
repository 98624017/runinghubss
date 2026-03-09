# RAccountStatusResponse

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888535.md`
- [官网明确] 页面编号：`155888535`
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
    RAccountStatusResponse:
      type: object
      properties:
        code:
          type: integer
          description: 返回标记：成功标记=0，非0失败，或者是功能码
        msg:
          type: string
          description: 返回信息
        data:
          $ref: '#/components/schemas/AccountStatusResponse'
          description: 数据
      x-apifox-orders:
        - code
        - msg
        - data
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
