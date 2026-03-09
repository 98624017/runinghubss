# Node.js SDK

## 目标

这套 Node.js SDK 面向 RunningHub AI 应用调用与任务轮询场景，覆盖以下常用能力：

- 账户检查
- 二进制文件上传
- AI 应用 demo 获取
- AI 应用任务发起
- 任务状态查询
- 任务结果查询
- V2 查询补偿
- 等待任务完成并落盘

实现文件位于：

- `assets/sdk/node/runninghub-client.mjs`
- `assets/sdk/node/quick-create-client.mjs`
- `assets/sdk/node/app-presets.mjs`
- `assets/sdk/node/examples/run-app.mjs`

## 运行要求

- Node.js `18+`
- 推荐 Node.js `20+`
- 依赖内建 `fetch`、`FormData`、`Blob`
- 使用环境变量 `RUNNINGHUB_API_KEY`

## 模块说明

### `runninghub-client.mjs`

底层 HTTP 客户端，负责：

- 统一请求头构造
- JSON 接口请求
- 上传接口调用
- API 错误封装
- JSON 结果落盘

公开内容：

- `RunningHubApiError`
- `maskApiKey(apiKey, visible = 4)`
- `RunningHubClient`

核心方法：

- `buildHeaders(options)`
- `checkAccount(options)`
- `getAiAppDemo(webappId, options)`
- `uploadFile(filePath)`
- `runAiApp({ webappId, nodeInfoList, webhookUrl, instanceType })`
- `queryStatus(taskId, options)`
- `queryOutputs(taskId, options)`
- `queryV2(taskId, options)`
- `saveJson(filePath, payload)`

### `quick-create-client.mjs`

面向 AI 应用的编排层，负责：

- 从 demo 中提取 `nodeInfoList`
- 按 `nodeId:fieldName` 覆盖节点值
- 发起 AI 应用任务
- 轮询任务直至完成
- 在失败时抛出结构化异常

公开内容：

- `RunningHubTaskFailure`
- `nodeLookupKey(node)`
- `cloneNodes(nodeInfoList)`
- `applyNodeOverrides(nodeInfoList, overrides)`
- `AiAppRunner`

### `app-presets.mjs`

内置四个 AI 应用 preset：

- `1994388299756212225` 室内设计平面图填色-立体版
- `1986819253754130433` Missa_建筑景观_风格迁移_效果图专用
- `2003678561775067138` 🍌香蕉 2 & Pro9图任意融合
- `2023563076041183233` 毛坯房出图-全能版

公开内容：

- `APP_PRESETS`
- `loadDemoJson(appId)`
- `buildAppOverrides(appId, { uploadedAssets, prompt })`
- `listSupportedAppIds()`

## 基础示例

```js
import { RunningHubClient } from './assets/sdk/node/runninghub-client.mjs';
import { AiAppRunner } from './assets/sdk/node/quick-create-client.mjs';
import { buildAppOverrides } from './assets/sdk/node/app-presets.mjs';

const client = new RunningHubClient({
  apiKey: process.env.RUNNINGHUB_API_KEY,
});

const runner = new AiAppRunner(client);

const upload = await client.uploadFile('./demo-floorplan.png');
const fileName = upload.data.fileName;

const nodeOverrides = buildAppOverrides('1994388299756212225', {
  uploadedAssets: [fileName],
});

const result = await runner.runAndWait('1994388299756212225', {
  nodeOverrides,
  pollIntervalMs: 12_000,
  timeoutMs: 1_800_000,
});

console.log(result.final);
```

## CLI 示例

```bash
export RUNNINGHUB_API_KEY="你的apikey"
node skills/runninghub-api-dev/assets/sdk/node/examples/run-app.mjs \
  --app-id 1994388299756212225 \
  --file ./demo-floorplan.png \
  --poll-interval-seconds 12 \
  --timeout-seconds 1800 \
  --save-json ./result.json
```

常用参数：

- `--app-id`：目标应用 ID
- `--file`：本地输入文件，可重复传入
- `--prompt`：覆盖默认提示词
- `--poll-interval-seconds` / `--poll-interval-ms`：轮询间隔
- `--timeout-seconds` / `--timeout-ms`：超时
- `--save-json`：保存结果 JSON

## 与验证脚本的关系

Node 侧提供独立真实验证入口：

- `scripts/validate/run_node_app_validation.sh`

它会：

- 读取 `assets/test-inputs/manifest.json`
- 上传本地测试素材
- 按 preset + `nodeOverrides` 组装 `nodeInfoList`
- 发起真实 AI 应用任务
- 轮询到完成后写入 `assets/validation/app-<id>-node.json`

## 已验证能力

截至 `2026-03-08`，Node 侧已完成：

- `1994388299756212225` 的真实闭环调用
- 上传 → 发起任务 → 轮询 → 结果落盘整链路验证

详细结果见：

- `assets/validation/app-1994388299756212225-node.json`
- `references/15-ai-app-validation.md`

## 错误处理建议

- 账户校验异常：优先检查 `Authorization` 和 body 中的 `apikey/apiKey` 是否都符合接口要求
- 上传异常：优先确认文件存在、文件大小、上传结果中的 `data.fileName`
- 任务发起异常：优先核对 `webappId` 与 `nodeInfoList`
- 轮询异常：优先记录 `status`、`outputs`、`queryV2` 三份原始响应
- 产物落盘前必须脱敏，仓库中统一使用 `<RUNNINGHUB_API_KEY>`

## 测试

Node 侧使用 `node:test`，测试文件位于：

- `assets/sdk/node/tests/runninghub-client.test.mjs`
- `assets/sdk/node/tests/quick-create-client.test.mjs`
- `assets/sdk/node/tests/app-presets.test.mjs`

建议验证命令：

```bash
node --test skills/runninghub-api-dev/assets/sdk/node/tests/*.test.mjs

node --check skills/runninghub-api-dev/assets/sdk/node/runninghub-client.mjs
node --check skills/runninghub-api-dev/assets/sdk/node/quick-create-client.mjs
node --check skills/runninghub-api-dev/assets/sdk/node/app-presets.mjs
node --check skills/runninghub-api-dev/assets/sdk/node/examples/run-app.mjs
```
