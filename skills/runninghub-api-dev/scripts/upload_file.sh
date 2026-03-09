#!/usr/bin/env bash
set -euo pipefail

# 上传文件到 RunningHub。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/upload_file.sh ./local-file.png

if [[ $# -ne 1 ]]; then
  echo "用法: RUNNINGHUB_API_KEY=xxx $0 <file-path>" >&2
  exit 1
fi

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

file_path="$1"

if [[ ! -f "$file_path" ]]; then
  echo "文件不存在: $file_path" >&2
  exit 1
fi

curl -sS 'https://www.runninghub.cn/openapi/v2/media/upload/binary' \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -F "file=@${file_path}"
echo
