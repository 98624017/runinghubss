# 发起ComfyUI任务 Response

- [官网明确] 页面类型：Schema
- [官网明确] 官方地址：`https://www.runninghub.cn/runninghub-api-doc-cn/schema-155888525.md`
- [官网明确] 页面编号：`155888525`
- [官网明确] Schema 名称：`TaskCreateResponse`

## 字段摘要

- [官网明确] `netWssUrl`：`string` Wss服务地址
- [官网明确] `taskId`：`integer` 任务Id
- [官网明确] `clientId`：`string` 客户端ID，当客户端首次接收clientId时，需要保存到本地，以便页面刷新重连或者二次运行任务传参使用
- [官网明确] `taskStatus`：`string` 任务状态: CREATE, SUCCESS, FAILED, RUNNING, QUEUED;
- [官网明确] `promptTips`：`string` 工作流验证结果提示,当不为空是UI需要展示节点错误信息

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
    TaskCreateResponse:
      type: object
      properties:
        netWssUrl:
          type: string
          description: Wss服务地址
        taskId:
          type: integer
          description: 任务Id
          format: int64
        clientId:
          type: string
          description: 客户端ID，当客户端首次接收clientId时，需要保存到本地，以便页面刷新重连或者二次运行任务传参使用
        taskStatus:
          type: string
          description: '任务状态: CREATE, SUCCESS, FAILED, RUNNING, QUEUED;'
        promptTips:
          type: string
          description: 工作流验证结果提示,当不为空是UI需要展示节点错误信息
      x-apifox-orders:
        - netWssUrl
        - taskId
        - clientId
        - taskStatus
        - promptTips
      x-apifox-folder: ''
    发起ComfyUI任务 Response:
      type: object
      properties:
        code:
          type: integer
          description: 返回标记：成功标记=0，非0失败，或者是功能码
          examples:
            - 0
        msg:
          type: string
          description: 返回信息
          examples:
            - success
        data:
          $ref: '#/components/schemas/TaskCreateResponse'
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
