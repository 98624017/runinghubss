# TaskRunWebappByKeyRequest

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-157370976.md`
- [官网明确] 页面编号：`157370976`
- [官网明确] Schema 名称：`NodeInfo`

## 字段摘要

- [官网明确] `nodeId`：`string`
- [官网明确] `nodeName`：`string`
- [官网明确] `fieldName`：`string`
- [官网明确] `fieldValue`：`string`
- [官网明确] `fieldData`：`string`
- [官网明确] `description`：`string`
- [官网明确] `descriptionEn`：`string`

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
    NodeInfo:
      type: object
      properties:
        nodeId:
          type: string
          description: ''
        nodeName:
          type: string
          description: ''
        fieldName:
          type: string
          description: ''
        fieldValue:
          type: string
          description: ''
        fieldData:
          type: string
          description: ''
        description:
          type: string
          description: ''
        descriptionEn:
          type: string
          description: ''
      x-apifox-orders:
        - nodeId
        - nodeName
        - fieldName
        - fieldValue
        - fieldData
        - description
        - descriptionEn
      x-apifox-folder: ''
    TaskRunWebappByKeyRequest:
      type: object
      properties:
        apiKey:
          type: string
          description: ''
        webappId:
          type: integer
          description: ''
          format: int64
        nodeInfoList:
          type: array
          items:
            $ref: '#/components/schemas/NodeInfo'
            description: com.haima.runninghub.common.model.pojo.NodeInfo
          description: ''
        webhookUrl:
          type: string
          description: ''
        instanceType:
          type: string
          description: 非必须，默认'default'调用24g显存机器，传'plus' 调用48g显存机器
      x-apifox-orders:
        - apiKey
        - webappId
        - nodeInfoList
        - webhookUrl
        - instanceType
      required:
        - webappId
        - nodeInfoList
        - apiKey
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
