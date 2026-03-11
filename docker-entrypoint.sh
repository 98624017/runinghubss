#!/bin/sh
set -e

SCHEMA="./prisma/schema.prisma"

# 检查 schema 文件是否存在
if [ ! -f "$SCHEMA" ]; then
  echo "Warning: $SCHEMA not found, skipping migration"
else
  # 运行数据库迁移
  prisma migrate deploy --schema="$SCHEMA"

  # 运行 seed（仅首次，失败不阻塞启动）
  prisma db seed --schema="$SCHEMA" 2>/dev/null || true
fi

exec "$@"
