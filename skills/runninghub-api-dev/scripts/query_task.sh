#!/usr/bin/env bash
set -euo pipefail

# 查询任务状态或结果。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/query_task.sh status 123456
#   RUNNINGHUB_API_KEY=xxx ./scripts/query_task.sh outputs 123456

if [[ $# -ne 2 ]]; then
  echo "用法: RUNNINGHUB_API_KEY=xxx $0 <status|outputs> <taskId>" >&2
  exit 1
fi

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

mode="$1"
task_id="$2"

case "$mode" in
  status)
    endpoint='https://www.runninghub.cn/task/openapi/status'
    ;;
  outputs)
    endpoint='https://www.runninghub.cn/task/openapi/outputs'
    ;;
  *)
    echo "第一个参数只能是 status 或 outputs" >&2
    exit 1
    ;;
esac

curl -sS "$endpoint" \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -H 'Content-Type: application/json' \
  --data-raw "{\"apiKey\":\"${RUNNINGHUB_API_KEY}\",\"taskId\":\"${task_id}\"}"
echo
