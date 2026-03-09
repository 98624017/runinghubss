import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Pool } from 'pg';

import { readServerEnv } from '../config/env.js';
import { ensureBundledApps } from './bootstrap.js';
import { createDatabasePool } from './connection.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const defaultMigrationsDir = path.join(currentDir, 'migrations');

export async function runMigrations(pool: Pool, migrationsDir = defaultMigrationsDir) {
  const filenames = (await readdir(migrationsDir))
    .filter((filename) => filename.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  // 迁移按文件名顺序执行，保证本地与生产的表结构演进一致。
  for (const filename of filenames) {
    const sql = await readFile(path.join(migrationsDir, filename), 'utf8');
    if (sql.trim()) {
      await pool.query(sql);
    }
  }
}

async function main() {
  const env = readServerEnv();
  const pool = createDatabasePool(env);

  try {
    await runMigrations(pool);
    await ensureBundledApps(pool);
    console.log(`数据库迁移完成：${defaultMigrationsDir}`);
  } finally {
    await pool.end();
  }
}

const isDirectExecution = process.argv[1]
  ? path.resolve(process.argv[1]) === currentFile
  : false;

if (isDirectExecution) {
  void main();
}
