# Python SDK

## 目标

这套 Python SDK 面向 RunningHub AI 应用调用与任务轮询场景，覆盖以下常用能力：

- 账户检查
- 二进制文件上传
- AI 应用 demo 获取
- AI 应用任务发起
- 任务状态查询
- 任务结果查询
- V2 查询补偿
- 等待任务完成并落盘

实现文件位于：

- `assets/sdk/python/runninghub_client.py`
- `assets/sdk/python/quick_create_client.py`
- `assets/sdk/python/app_presets.py`
- `assets/sdk/python/examples/run_app.py`

## 运行要求

- Python `3.10+`
- 依赖 `requests`
- 使用环境变量 `RUNNINGHUB_API_KEY`

## 模块说明

### `runninghub_client.py`

底层 HTTP 客户端，负责：

- 统一请求头构造
- JSON 接口请求
- 上传接口调用
- API 错误封装
- JSON 结果落盘

公开内容：

- `RunningHubApiError`
- `mask_api_key(api_key, visible=4)`
- `RunningHubClient`

核心方法：

- `check_account(include_auth=True, include_body=True)`
- `get_ai_app_demo(webapp_id, include_auth=True)`
- `upload_file(file_path)`
- `run_ai_app(webapp_id, node_info_list, webhook_url=None, instance_type=None)`
- `query_status(task_id, include_auth=True, include_body_api_key=True)`
- `query_outputs(task_id, include_auth=True, include_body_api_key=True)`
- `query_v2(task_id, include_auth=True)`
- `save_json(path, payload)`

### `quick_create_client.py`

面向 AI 应用的编排层，负责：

- 从 demo 中提取 `nodeInfoList`
- 按 `nodeId:fieldName` 覆盖节点值
- 发起 AI 应用任务
- 轮询任务直至完成
- 在失败时抛出结构化异常

公开内容：

- `RunningHubTaskFailure`
- `node_lookup_key(node)`
- `clone_nodes(node_info_list)`
- `apply_node_overrides(node_info_list, overrides)`
- `AiAppRunner`

### `app_presets.py`

内置四个 AI 应用 preset：

- `1994388299756212225` 室内设计平面图填色-立体版
- `1986819253754130433` Missa_建筑景观_风格迁移_效果图专用
- `2003678561775067138` 🍌香蕉 2 & Pro9图任意融合
- `2023563076041183233` 毛坯房出图-全能版

公开内容：

- `APP_PRESETS`
- `load_demo_json(app_id)`
- `build_app_overrides(app_id, uploaded_assets, prompt=None)`
- `list_supported_app_ids()`

## 基础示例

```python
from app_presets import build_app_overrides
from quick_create_client import AiAppRunner
from runninghub_client import RunningHubClient

client = RunningHubClient(api_key=os.environ["RUNNINGHUB_API_KEY"])
runner = AiAppRunner(client)

upload = client.upload_file("./demo-floorplan.png")
file_name = upload["data"]["fileName"]

node_overrides = build_app_overrides(
    "1994388299756212225",
    uploaded_assets=[file_name],
)

result = runner.run_and_wait(
    "1994388299756212225",
    node_overrides=node_overrides,
    poll_interval=12,
    timeout_seconds=1800,
)

print(result["final"])
```

## CLI 示例

```bash
export RUNNINGHUB_API_KEY="你的apikey"
PYTHONPATH=skills/runninghub-api-dev/assets/sdk/python \
python skills/runninghub-api-dev/assets/sdk/python/examples/run_app.py \
  --app-id 1994388299756212225 \
  --file ./demo-floorplan.png \
  --save-json ./result.json
```

常用参数：

- `--app-id`：目标应用 ID
- `--file`：本地输入文件，可重复传入
- `--prompt`：覆盖默认提示词
- `--poll-interval`：轮询间隔，单位秒
- `--timeout-seconds`：超时，单位秒
- `--save-json`：保存结果 JSON

## 与验证脚本的关系

真实闭环验证脚本直接复用这套 SDK：

- `scripts/validate/run_python_app_validation.sh`

它会：

- 读取 `assets/test-inputs/manifest.json`
- 上传本地测试素材
- 按 preset + `nodeOverrides` 组装 `nodeInfoList`
- 发起真实 AI 应用任务
- 轮询到完成后写入 `assets/validation/app-<id>-python.json`

## 已验证能力

截至 `2026-03-08`，这套 Python SDK 已完成：

- 4 个目标 AI 应用的真实闭环调用
- `1994388299756212225` 的单图闭环
- `1986819253754130433` 的双图风格迁移闭环
- `2003678561775067138` 的 9 图融合闭环
- `2023563076041183233` 的双图 + LIST 参数闭环

详细结果见：

- `references/15-ai-app-validation.md`
- `assets/validation/summary.json`

## 测试

Python 侧单元测试位于：

- `assets/sdk/python/tests/test_runninghub_client.py`
- `assets/sdk/python/tests/test_quick_create_client.py`
- `assets/sdk/python/tests/test_app_presets.py`

建议验证命令：

```bash
PYTHONPATH=skills/runninghub-api-dev/assets/sdk/python \
python -m unittest discover -s skills/runninghub-api-dev/assets/sdk/python/tests -v

python -m py_compile \
  skills/runninghub-api-dev/assets/sdk/python/runninghub_client.py \
  skills/runninghub-api-dev/assets/sdk/python/quick_create_client.py \
  skills/runninghub-api-dev/assets/sdk/python/app_presets.py \
  skills/runninghub-api-dev/assets/sdk/python/examples/run_app.py
```

## 注意点

- 账户接口、状态接口、结果接口都不应只依赖 Authorization Header，Body 中的 `apikey/apiKey` 仍要按接口要求传
- AI 应用 demo 返回的 `curl` 示例中可能包含调用时的真实 `apiKey` 占位；本仓库已统一脱敏为 `<RUNNINGHUB_API_KEY>`
- `2023563076041183233` 官方 demo 默认 `2k`，但当前验证账户在 `2k` 档位会触发第三方余额不足；验证时使用 `1k` 覆盖参数，见 `assets/test-inputs/manifest.json`
