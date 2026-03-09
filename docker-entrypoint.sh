#!/bin/sh
set -e

# 运行数据库迁移
npx prisma migrate deploy

# 运行 seed（仅首次）
npx prisma db seed || true

exec "$@"
