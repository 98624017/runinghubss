#!/usr/bin/env bash
set -euo pipefail

# 验证账户接口对 Header / Body 鉴权的差异。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/smoke/check_headers.sh

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

echo '== header + body =='
curl -sS 'https://www.runninghub.cn/uc/openapi/accountStatus' \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -H 'Content-Type: application/json' \
  --data-raw "{\"apikey\":\"${RUNNINGHUB_API_KEY}\"}"
echo
echo

echo '== header only =='
curl -sS 'https://www.runninghub.cn/uc/openapi/accountStatus' \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -H 'Content-Type: application/json' \
  --data-raw '{}'
echo
echo

echo '== body only =='
curl -sS 'https://www.runninghub.cn/uc/openapi/accountStatus' \
  -H 'Host: www.runninghub.cn' \
  -H 'Content-Type: application/json' \
  --data-raw "{\"apikey\":\"${RUNNINGHUB_API_KEY}\"}"
echo
