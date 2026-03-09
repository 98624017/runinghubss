import { newDb } from 'pg-mem';
import type { Pool } from 'pg';

import { runMigrations } from './migrate.js';

export type TestDatabase = {
  pool: Pool;
  close(): Promise<void>;
};

export async function createTestDatabase(): Promise<TestDatabase> {
  const database = newDb({
    autoCreateForeignKeyIndices: true,
  });
  const adapter = database.adapters.createPg();
  const pool = new adapter.Pool() as unknown as Pool;

  await runMigrations(pool);

  return {
    pool,
    close: async () => {
      await pool.end();
    },
  };
}
