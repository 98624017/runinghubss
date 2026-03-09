# ApiUploadLoraRequest

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888539.md`
- [官网明确] 页面编号：`155888539`
- [官网明确] Schema 名称：`ApiUploadLoraRequest`

## 字段摘要

- [官网明确] `loraName`：`string` lora name, cannot be blank
- [官网明确] `md5Hex`：`string` file MD5, cannot be blank
- [官网明确] `apiKey`：`string` apiKey, cannot be blank

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
    ApiUploadLoraRequest:
      type: object
      properties:
        loraName:
          type: string
          description: lora name, cannot be blank
          examples:
            - my-lora-name
        md5Hex:
          type: string
          description: file MD5, cannot be blank
          examples:
            - f8d958506e6c8044f79ccd7c814c6179
        apiKey:
          type: string
          description: apiKey, cannot be blank
          examples:
            - '{{apiKey}}'
      x-apifox-orders:
        - apiKey
        - loraName
        - md5Hex
      required:
        - loraName
        - md5Hex
        - apiKey
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []
```
