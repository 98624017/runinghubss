# 快捷创作调用

## 适用场景

当你不是直接面向某个 `workflowId`，而是要调用 RunningHub 平台“快捷创作”页面里的现成能力时，走这条路线。

## 核心接口

- 方法：`POST`
- 路径：`/task/openapi/quick-ai-app/run`

## 关键入参

文档与接口示例显示，这类调用通常需要：

- `webappId`
- `apiKey`
- `quickCreateCode`
- `nodeInfoList`

典型结构：

```json
{
  "webappId": "196********290",
  "apiKey": "*********************",
  "quickCreateCode": "***",
  "nodeInfoList": [
    {
      "nodeId": "2",
      "nodeName": "LoadImage",
      "fieldName": "image",
      "fieldType": "IMAGE",
      "fieldValue": "61a52873b2f16cf3734dad1d20f704d32ca5f1d77896847f27a1e1ee72eb626d.jpg",
      "description": "上传图像"
    }
  ]
}
```

## 参数来源

官方文档建议：

1. 登录 RunningHub
2. 进入对应快捷创作模块页面
3. 点击“调用 API”
4. 从页面示例中直接取得：
   - `webappId`
   - `quickCreateCode`
   - `nodeInfoList`

也就是说，快捷创作接口的最佳实践不是“自己猜参数”，而是**从页面现成示例回填**。

## `nodeInfoList` 与 ComfyUI 的区别

快捷创作里的 `nodeInfoList` 往往更完整，除了常见字段，还会出现：

- `nodeName`
- `fieldType`
- `description`

常见 `fieldType` 包括：

- `STRING`
- `INT`
- `SWITCH`
- `LORA`
- `IMAGE`

## 何时选快捷创作

- 目标能力已经在 RunningHub 平台现成存在
- 页面已经提供了可复制的 API 示例
- 你不想维护底层 ComfyUI 工作流细节

## 何时不要选快捷创作

- 你需要完全控制工作流结构
- 你已经有成熟的 `workflowId` 接入方案
- 你需要复用自定义 ComfyUI 工作流节点逻辑

## 返回结果

成功时文档示例通常包含：

- `taskId`
- `netWssUrl`
- `clientId`
- `taskStatus`
- `promptTips`

后续查询状态与结果，仍然沿用通用任务查询接口。
