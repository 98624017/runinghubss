#!/usr/bin/env bash
set -euo pipefail

# 使用 Python SDK 对单个 AI 应用做真实闭环验证。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/validate/run_python_app_validation.sh 1994388299756212225
#   RUNNINGHUB_API_KEY=xxx ./scripts/validate/run_python_app_validation.sh 1994388299756212225 ./custom.json

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "用法: RUNNINGHUB_API_KEY=xxx $0 <app-id> [output-json]" >&2
  exit 1
fi

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "${script_dir}/../.." && pwd)"
manifest_path="${skill_dir}/assets/test-inputs/manifest.json"
output_dir="${skill_dir}/assets/validation"
app_id="$1"
output_json="${2:-${output_dir}/app-${app_id}-python.json}"
poll_interval="${RUNNINGHUB_POLL_INTERVAL:-12}"
timeout_seconds="${RUNNINGHUB_TIMEOUT_SECONDS:-1800}"

mkdir -p "${output_dir}"

PYTHONPATH="${skill_dir}/assets/sdk/python" \
RUNNINGHUB_SKILL_DIR="${skill_dir}" \
RUNNINGHUB_MANIFEST_PATH="${manifest_path}" \
RUNNINGHUB_OUTPUT_JSON="${output_json}" \
RUNNINGHUB_APP_ID="${app_id}" \
RUNNINGHUB_POLL_INTERVAL="${poll_interval}" \
RUNNINGHUB_TIMEOUT_SECONDS="${timeout_seconds}" \
python - <<'PY'
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from app_presets import build_app_overrides
from quick_create_client import AiAppRunner
from runninghub_client import RunningHubClient


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def redact_payload(value: object, api_key: str) -> object:
    if isinstance(value, dict):
        result: dict[object, object] = {}
        for key, item in value.items():
            if key == "apiKey":
                result[key] = "<RUNNINGHUB_API_KEY>"
                continue
            result[key] = redact_payload(item, api_key)
        return result
    if isinstance(value, list):
        return [redact_payload(item, api_key) for item in value]
    if isinstance(value, str):
        return value.replace(api_key, "<RUNNINGHUB_API_KEY>")
    return value


skill_dir = Path(os.environ["RUNNINGHUB_SKILL_DIR"])
manifest_path = Path(os.environ["RUNNINGHUB_MANIFEST_PATH"])
output_json = Path(os.environ["RUNNINGHUB_OUTPUT_JSON"])
app_id = os.environ["RUNNINGHUB_APP_ID"]
poll_interval = int(os.environ["RUNNINGHUB_POLL_INTERVAL"])
timeout_seconds = int(os.environ["RUNNINGHUB_TIMEOUT_SECONDS"])
api_key = os.environ["RUNNINGHUB_API_KEY"]

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
app_case = ((manifest.get("apps") or {}).get(app_id) or (manifest.get("appRuns") or {}).get(app_id))
if not app_case:
    raise SystemExit(f"manifest 中不存在应用 {app_id}")

assets_dir = skill_dir / "assets" / "test-inputs"
local_files = [assets_dir / name for name in app_case.get("files", [])]
missing_files = [str(path) for path in local_files if not path.is_file()]
if missing_files:
    raise SystemExit(f"缺少测试素材：{missing_files}")

client = RunningHubClient(api_key=api_key)
runner = AiAppRunner(client)

uploaded_assets: list[dict[str, object]] = []
for file_path in local_files:
    upload_result = client.upload_file(file_path)
    file_name = ((upload_result.get("data") or {}).get("fileName"))
    if not file_name:
        raise SystemExit(f"上传失败：{upload_result}")
    uploaded_assets.append(
        {
            "localFile": file_path.name,
            "uploadedFileName": file_name,
            "uploadResult": upload_result,
        }
    )

overrides = build_app_overrides(
    app_id,
    uploaded_assets=[item["uploadedFileName"] for item in uploaded_assets],
    prompt=app_case.get("prompt"),
)
overrides.update(app_case.get("nodeOverrides") or {})

started_at = now_iso()
run_result = runner.run_and_wait(
    app_id,
    node_overrides=overrides,
    poll_interval=poll_interval,
    timeout_seconds=timeout_seconds,
    instance_type=app_case.get("instanceType"),
)
finished_at = now_iso()

record = {
    "sdk": "python",
    "appId": app_id,
    "startedAt": started_at,
    "finishedAt": finished_at,
    "manifestPrompt": app_case.get("prompt"),
    "manifestFiles": [path.name for path in local_files],
    "manifestRationale": app_case.get("rationale"),
    "manifestNodeOverrides": app_case.get("nodeOverrides"),
    "manifestInstanceType": app_case.get("instanceType"),
    "uploadedAssets": uploaded_assets,
    "result": run_result,
}
record = redact_payload(record, api_key)

output_json.parent.mkdir(parents=True, exist_ok=True)
output_json.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({
    "sdk": record["sdk"],
    "appId": record["appId"],
    "taskId": ((run_result.get("submit") or {}).get("data") or {}).get("taskId"),
    "outputPath": str(output_json),
    "finalState": ((run_result.get("final") or {}).get("finalState")),
}, ensure_ascii=False, indent=2))
PY
