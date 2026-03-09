# 获取webhook事件详情Request

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888531.md`
- [官网明确] 页面编号：`155888531`
- [官网明确] Schema 名称：`获取webhook事件详情Request`

## 字段摘要

- [官网明确] `apiKey`：`string`
- [官网明确] `taskId`：`string`

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
    获取webhook事件详情Request:
      type: object
      properties:
        apiKey:
          type: string
          description: ''
          examples:
            - '{{apiKey}}'
        taskId:
          type: string
          examples:
            - '1904154698679771137'
      x-apifox-orders:
        - apiKey
        - taskId
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
