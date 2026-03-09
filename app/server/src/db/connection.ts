import { Pool } from 'pg';

import type { ServerEnv } from '../config/env.js';

function resolveDatabaseSsl(databaseUrl: string, nodeEnv: ServerEnv['nodeEnv']) {
  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase();
    if (sslMode === 'disable') {
      return false;
    }
  } catch {}

  return nodeEnv === 'production' ? { rejectUnauthorized: false } : false;
}

export function createDatabasePool(env: Pick<ServerEnv, 'databaseUrl' | 'nodeEnv'>) {
  return new Pool({
    connectionString: env.databaseUrl,
    ssl: resolveDatabaseSsl(env.databaseUrl, env.nodeEnv),
  });
}
