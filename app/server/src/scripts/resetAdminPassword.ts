import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readServerEnv } from '../config/env.js';
import { createDatabasePool } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { resetAdminPassword } from '../services/adminCredentials.js';

function readCliArg(flagName: string) {
  const flag = `--${flagName}`;
  const index = process.argv.findIndex((item) => item === flag);
  if (index < 0) {
    return '';
  }
  return String(process.argv[index + 1] || '').trim();
}

function printUsage() {
  console.log(
    '用法：npm run admin:reset-password --workspace server -- --username admin --password 新密码',
  );
}

export async function runResetAdminPasswordCli() {
  const username = readCliArg('username') || 'admin';
  const password = readCliArg('password');

  if (!password) {
    printUsage();
    throw new Error('缺少 --password 参数');
  }

  const env = readServerEnv();
  const pool = createDatabasePool(env);

  try {
    await runMigrations(pool);
    const result = await resetAdminPassword(pool, {
      username,
      nextPassword: password,
    });

    console.log(
      `管理员密码重置完成：username=${result.username} action=${result.action}`,
    );
  } finally {
    await pool.end();
  }
}

const currentFile = fileURLToPath(import.meta.url);
const isDirectExecution = process.argv[1]
  ? path.resolve(process.argv[1]) === currentFile
  : false;

if (isDirectExecution) {
  void runResetAdminPasswordCli();
}
