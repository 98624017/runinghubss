# RWorkflowDuplicateResponse

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888534.md`
- [官网明确] 页面编号：`155888534`
- [官网明确] Schema 名称：`WorkflowDuplicateResponse`

## 字段摘要

- [官网明确] `newWorkflowId`：`string`

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
    WorkflowDuplicateResponse:
      type: object
      properties:
        newWorkflowId:
          type: string
      x-apifox-orders:
        - newWorkflowId
      x-apifox-folder: ''
    RWorkflowDuplicateResponse:
      type: object
      properties:
        code:
          type: integer
          description: 返回标记：成功标记=0，非0失败，或者是功能码
        msg:
          type: string
          description: 返回信息
        data:
          $ref: '#/components/schemas/WorkflowDuplicateResponse'
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
