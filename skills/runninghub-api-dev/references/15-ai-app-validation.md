# 四个 AI 应用真实闭环验证

## 结论先看

截至 `2026-03-08`，目标四个 AI 应用都已经完成至少一次真实闭环：

- `1986819253754130433`：Python SDK 成功
- `1994388299756212225`：Python SDK 成功，Node SDK 也成功
- `2003678561775067138`：Python SDK 成功
- `2023563076041183233`：Python SDK 成功

完整汇总见：

- `assets/validation/summary.json`

单次执行原始记录见：

- `assets/validation/app-1986819253754130433-python.json`
- `assets/validation/app-1994388299756212225-python.json`
- `assets/validation/app-1994388299756212225-node.json`
- `assets/validation/app-2003678561775067138-python.json`
- `assets/validation/app-2023563076041183233-python.json`

## 测试素材策略

素材来源以公网可访问图片为主，优先顺序如下：

1. RunningHub 官方 AI 应用详情页公开 `covers`
2. 在 `covers` 基础上做本地裁切，构造更贴近节点语义的最小素材
3. 对 9 图融合应用补齐多张部件级参考图

素材清单入口：

- `assets/test-inputs/manifest.json`

实际本地素材位于：

- `assets/test-inputs/`

## 验证方法

### Python

逐个应用执行：

```bash
RUNNINGHUB_API_KEY=你的apikey \
skills/runninghub-api-dev/scripts/validate/run_python_app_validation.sh <app-id>
```

### Node

Node 真实闭环入口：

```bash
RUNNINGHUB_API_KEY=你的apikey \
skills/runninghub-api-dev/scripts/validate/run_node_app_validation.sh 1994388299756212225
```

### 汇总

```bash
python skills/runninghub-api-dev/scripts/validate/build_validation_summary.py
```

## 分应用结果

### `1994388299756212225` 室内设计平面图填色-立体版

- 实测 SDK：
  - Python
  - Node
- 实测任务：
  - Python `taskId=2030465625113104385`
  - Node `taskId=2030466545649590273`
- 输入：
  - 1 张平面白图
  - 1 条文本提示词
  - `260:width=1600`
  - `260:height=1600`
- 结果：
  - 两次闭环都成功
  - 输出数量均为 `1`
- 价值：
  - 同时验证了 Python/Node 两套 SDK 的上传、任务发起、轮询与结果解析

### `1986819253754130433` Missa_建筑景观_风格迁移_效果图专用

- 实测 SDK：Python
- 实测任务：`taskId=2030472866847399938`
- 输入：
  - 2 张图片
  - 不传 prompt
- 结果：
  - 闭环成功
  - 输出数量为 `2`
- 价值：
  - 证明公开 demo 的双图输入模板可直接用于真实调用
  - 证明此应用不依赖文本 prompt 也能完成执行

### `2003678561775067138` 🍌香蕉 2 & Pro9图任意融合

- 实测 SDK：Python
- 实测任务：`taskId=2030466557397835777`
- 输入：
  - 9 张图片
  - 1 条中文 prompt
- 结果：
  - 闭环成功
  - 输出数量为 `1`
- 价值：
  - 证明公开模板暴露的 9 图输入槽位是真实可运行的
  - 证明官方封面裁切出的 9 张局部参考图足以完成接口闭环验证

### `2023563076041183233` 毛坯房出图-全能版

- 实测 SDK：Python
- 实测任务：`taskId=2030475511414792193`
- 输入：
  - 2 张图片
  - 1 条中文 prompt
  - LIST 参数：
    - `605:aspectRatio=auto`
    - `605:resolution=1k`
    - `605:channel=Third-party`
- 结果：
  - 闭环成功
  - 输出数量为 `1`
- 关键实测差异：
  - 官方 demo 默认 `605:resolution=2k`
  - 当前验证账户在 `2k` 下返回 `code=433`
  - 错误核心是第三方 API 余额不足
  - 改成 `1k` 后即可成功提交并完成
- 价值：
  - 证明这个应用的 LIST 节点参数必须纳入真实工程验证
  - 证明默认值不一定适合所有账户余额状态

## 关键工程结论

- `GET /api/webapp/apiCallDemo` 足以提取四个 AI 应用的真实 `nodeInfoList` 模板
- `POST /task/openapi/ai-app/run` 可直接用于这四个页面型 AI 应用，不需要 `quickCreateCode`
- `1986819253754130433` 的最小输入就是两张图
- `2003678561775067138` 当前公开模板就是 9 图版，不应假设 2 图即可跑通
- `2023563076041183233` 虽然官网默认 `2k`，但实际可用性受当前账户第三方余额影响
- 真实产物保存前必须脱敏；本仓库中的 `apiKey` 统一替换成 `<RUNNINGHUB_API_KEY>`

## 推荐使用方式

如果你的目标是复制这套闭环：

1. 先看 `assets/test-inputs/manifest.json`
2. 再看 `references/13-python-sdk.md` 或 `references/14-node-sdk.md`
3. 用 `scripts/validate/run_python_app_validation.sh` 先跑 Python
4. 如果还要验证 JS 调用链，再跑 `scripts/validate/run_node_app_validation.sh`

如果你的目标是直接抄现成结论：

- 看 `assets/validation/summary.json`
- 再进入对应 `app-*.json` 查看当次上传文件、节点覆盖值和输出结构
