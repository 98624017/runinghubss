#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from app_presets import APP_PRESETS, build_app_overrides
from quick_create_client import AiAppRunner
from runninghub_client import RunningHubClient


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="运行 RunningHub AI 应用示例")
    parser.add_argument("--app-id", required=True, choices=sorted(APP_PRESETS.keys()))
    parser.add_argument("--file", action="append", default=[], help="本地输入文件，可重复传入")
    parser.add_argument("--prompt", default=None, help="覆盖默认提示词")
    parser.add_argument("--save-json", default=None, help="保存执行结果到 JSON 文件")
    parser.add_argument("--poll-interval", type=int, default=12)
    parser.add_argument("--timeout-seconds", type=int, default=1800)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    api_key = os.environ.get("RUNNINGHUB_API_KEY")
    if not api_key:
        raise SystemExit("缺少环境变量 RUNNINGHUB_API_KEY")

    client = RunningHubClient(api_key=api_key)
    runner = AiAppRunner(client)

    uploaded_assets: list[str] = []
    for file_path in args.file:
        upload_result = client.upload_file(file_path)
        file_name = ((upload_result.get("data") or {}).get("fileName"))
        if not file_name:
            raise SystemExit(f"上传失败：{upload_result}")
        uploaded_assets.append(file_name)

    overrides = build_app_overrides(
        args.app_id,
        uploaded_assets=uploaded_assets,
        prompt=args.prompt,
    )
    result = runner.run_and_wait(
        args.app_id,
        node_overrides=overrides,
        poll_interval=args.poll_interval,
        timeout_seconds=args.timeout_seconds,
    )

    output = json.dumps(result, ensure_ascii=False, indent=2)
    print(output)
    if args.save_json:
        Path(args.save_json).write_text(output + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
