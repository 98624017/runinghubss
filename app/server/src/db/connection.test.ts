import { describe, expect, it, vi } from 'vitest';

const poolMock = vi.fn();

vi.mock('pg', () => ({
  Pool: poolMock,
}));

describe('createDatabasePool', () => {
  it('生产模式下若 DATABASE_URL 显式声明 sslmode=disable，应禁用 ssl', async () => {
    const { createDatabasePool } = await import('./connection.js');

    createDatabasePool({
      databaseUrl: 'postgresql://demo:demo@127.0.0.1:5432/demo?sslmode=disable',
      nodeEnv: 'production',
    });

    expect(poolMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgresql://demo:demo@127.0.0.1:5432/demo?sslmode=disable',
        ssl: false,
      }),
    );
  });
});
