import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { ServerEnv } from '../config/env.js';
import { createTestDatabase } from '../db/testDatabase.js';
import { createApiKeyArchiveRepository } from '../repositories/apiKeyArchiveRepository.js';
import { createApp } from '../app.js';

function createServerEnv(): ServerEnv {
  return {
    port: 8787,
    databaseUrl: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
    adminPath: '/admin-console',
    adminDefaultUsername: 'admin',
    adminDefaultPassword: 'change-me',
    sessionSecret: 'session-secret',
    nodeEnv: 'test',
  };
}

describe('admin multipliers routes', () => {
  it('应支持查看并更新单独 API Key 倍率', async () => {
    const database = await createTestDatabase();
    const archiveRepository = createApiKeyArchiveRepository(database.pool as any);
    const app = createApp(
      {
        checkAccount: vi.fn(async () => ({ code: 0, data: { remainCoins: '100' } })),
      } as any,
      {
        env: createServerEnv(),
        pool: database.pool as any,
      },
    );

    try {
      const firstArchive = await archiveRepository.findOrCreateArchive({
        apiKeyHash: 'hash-demo-key',
        apiKeyMasked: 'rk-***-demo',
      });
      await archiveRepository.updateBalanceSnapshot({
        archiveId: firstArchive.id,
        displayMultiplier: 2.2,
        lastCheckedBalance: '20',
        lastCheckedDisplayBalance: '44',
        status: 'active',
      });

      await archiveRepository.findOrCreateArchive({
        apiKeyHash: 'hash-second-key',
        apiKeyMasked: 'rk-***-next',
      });

      const loginResponse = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'change-me',
      });
      const cookie = loginResponse.headers['set-cookie']?.[0];
      expect(cookie).toBeTruthy();

      const listResponse = await request(app).get('/api/admin/multipliers').set('Cookie', cookie);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.archives).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            apiKeyHash: 'hash-demo-key',
            apiKeyMasked: 'rk-***-demo',
            displayMultiplier: 2.2,
          }),
        ]),
      );

      const updateResponse = await request(app)
        .patch(`/api/admin/multipliers/${firstArchive.id}`)
        .set('Cookie', cookie)
        .send({ displayMultiplier: 3.5 });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.archive).toEqual(
        expect.objectContaining({
          id: firstArchive.id,
          displayMultiplier: 3.5,
        }),
      );

      const updatedArchive = await archiveRepository.findByHash('hash-demo-key');
      expect(updatedArchive?.displayMultiplier).toBe(3.5);
    } finally {
      await database.close();
    }
  });
});
