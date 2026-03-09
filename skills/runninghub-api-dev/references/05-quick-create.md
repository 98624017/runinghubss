# 快捷创作接入

## 什么时候该走快捷创作

- [官网明确] 当你面对的是 RunningHub 平台里的某个“快捷创作”模块页
- [交叉整理] 当页面本身已经给你现成的 API 示例，而你不想自己维护底层工作流

## 核心接口

- [官网明确] `POST /task/openapi/quick-ai-app/run`

## 关键入参

- `webappId`
  - [官网明确] 快捷创作应用 ID
- `apiKey`
  - [官网明确] API Key
- `quickCreateCode`
  - [官网明确] 快捷创作代码
- `nodeInfoList`
  - [官网明确] 参数列表

## 参数最可靠的来源

1. [官网明确] 登录 RunningHub
2. [官网明确] 进入目标快捷创作模块页
3. [官网明确] 点击“调用 API”
4. [交叉整理] 直接复制页面给出的示例参数

## 和工作流 API 的主要区别

- [交叉整理] 快捷创作更偏“页面能力映射”
- [交叉整理] 工作流 API 更偏“自有工作流编排”
- [官网明确] 快捷创作 `nodeInfoList` 中常带：
  - `nodeName`
  - `fieldType`
  - `description`

## 开发建议

- [推断建议] 不要手工猜 `quickCreateCode`
- [推断建议] 不要把快捷创作与 ComfyUI 工作流参数结构混用
- [交叉整理] 如果一个需求既能走快捷创作也能走工作流，优先选你更容易稳定维护的一条

## 返回关注点

- [官网明确] 常见返回会带：
  - `taskId`
  - `netWssUrl`
  - `clientId`
  - `taskStatus`
  - `promptTips`

## 推荐阅读顺序

1. `references/02-api-concepts.md`
2. 本页
3. `references/07-task-status-results-webhook.md`
4. 对应 `references/endpoints/*.md`
