#!/usr/bin/env bash
set -euo pipefail

# 最小化账号联调用脚本。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/check_account.sh

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

curl -sS 'https://www.runninghub.cn/uc/openapi/accountStatus' \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -H 'Content-Type: application/json' \
  --data-raw "{\"apikey\":\"${RUNNINGHUB_API_KEY}\"}"
echo
