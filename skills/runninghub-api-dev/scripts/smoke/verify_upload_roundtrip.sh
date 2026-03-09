#!/usr/bin/env bash
set -euo pipefail

# 上传一个 1x1 PNG，验证上传链路是否正常。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/smoke/verify_upload_roundtrip.sh

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

tmp_png="$(mktemp /tmp/rh-upload-smoke-XXXXXX.png)"
trap 'rm -f "$tmp_png"' EXIT

base64 -d > "$tmp_png" <<'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV7kAAAAASUVORK5CYII=
EOF

curl -sS 'https://www.runninghub.cn/openapi/v2/media/upload/binary' \
  -H 'Host: www.runninghub.cn' \
  -H "Authorization: Bearer ${RUNNINGHUB_API_KEY}" \
  -F "file=@${tmp_png};type=image/png"
echo
