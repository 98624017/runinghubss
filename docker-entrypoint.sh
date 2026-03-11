#!/bin/sh
set -e

# 运行数据库迁移
prisma migrate deploy

# 运行 seed（仅首次，失败不阻塞启动）
prisma db seed 2>/dev/null || true

exec "$@"
