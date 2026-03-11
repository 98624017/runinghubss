#!/bin/sh
set -e

SCHEMA="./prisma/schema.prisma"

# 检查 schema 文件是否存在
if [ ! -f "$SCHEMA" ]; then
  echo "ERROR: $SCHEMA not found, cannot run migrations"
  echo "Skipping database initialization..."
  exec "$@"
fi

# 运行数据库迁移（失败则中止启动）
echo "Running database migrations..."
if prisma migrate deploy --schema="$SCHEMA"; then
  echo "Migrations completed successfully"
else
  echo "ERROR: Migration failed! Aborting startup."
  exit 1
fi

# 运行 seed（仅首次需要，失败记录日志但不阻塞启动）
echo "Running database seed..."
if prisma db seed --schema="$SCHEMA" 2>&1; then
  echo "Seed completed successfully"
else
  echo "Warning: Seed failed or already seeded, continuing startup"
fi

exec "$@"
