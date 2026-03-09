#!/usr/bin/env bash
set -euo pipefail

# 查询任务结果。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/query_result.sh 123456

if [[ $# -ne 1 ]]; then
  echo "用法: RUNNINGHUB_API_KEY=xxx $0 <taskId>" >&2
  exit 1
fi

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

task_id="$1"

curl -sS 'https://www.runninghub.cn/task/openapi/outputs' \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -H 'Content-Type: application/json' \
  --data-raw "{\"apiKey\":\"${RUNNINGHUB_API_KEY}\",\"taskId\":\"${task_id}\"}"
echo
