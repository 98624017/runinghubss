import { readServerEnv } from './config/env.js';
import { ensureBundledApps } from './db/bootstrap.js';
import { createDatabasePool } from './db/connection.js';
import { createApp } from './app.js';

const env = readServerEnv();
const port = env.port;
const pool = createDatabasePool(env);

await ensureBundledApps(pool);

createApp(undefined, { env, pool }).listen(port, () => {
  console.log(`RunningHub AI Console server listening on http://localhost:${port}`);
  console.log(`Admin path: ${env.adminPath}`);
});
