import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { ServerEnv } from '../config/env.js';
import { createApp } from '../app.js';
import { createTestDatabase } from '../db/testDatabase.js';
import { createAppRepository } from '../repositories/appRepository.js';

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

describe('admin tasks routes', () => {
  it('应支持查看最近任务并按 upstreamTaskId 检索事件明细', async () => {
    const database = await createTestDatabase();
    const appRepository = createAppRepository(database.pool as any);

    await appRepository.createApp({
      slug: 'floorplan-colorize',
      displayName: '一键彩平',
      subtitle: '快速生成彩平图',
      description: '将平面图转换为彩平图。',
      coverImageUrl: null,
      tags: ['彩平'],
      sortOrder: 1,
      isEnabled: true,
      usageTips: [],
      resultTips: ['结果链接可能失效，请及时下载'],
      upstreamAppId: '1994388299756212225',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 1,
      maxPollAttempts: 10,
      timeoutSeconds: 10,
      maxConcurrencyPerKey: 1,
    });

    const app = createApp(
      {
        checkAccount: vi.fn(async () => ({ code: 0, data: { remainCoins: '100' } })),
        uploadFile: vi.fn(async () => ({ code: 0, data: { fileName: 'openapi/floorplan.png' } })),
        runAiApp: vi.fn(async () => ({ code: 0, data: { taskId: 'upstream-1001' } })),
        queryStatus: vi.fn(async () => ({ code: 0, data: { status: 'RUNNING' } })),
        queryOutputs: vi.fn(async () => ({
          code: 0,
          data: [
            {
              fileUrl: 'https://example.com/floorplan-result.png',
              taskCostTime: 18,
            },
          ],
        })),
      } as any,
      {
        env: createServerEnv(),
        pool: database.pool as any,
      },
    );

    try {
      const loginResponse = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'change-me',
      });
      const cookie = loginResponse.headers['set-cookie']?.[0];
      expect(cookie).toBeTruthy();

      const executeResponse = await request(app)
        .post('/api/apps/1994388299756212225/execute')
        .field('apiKey', 'demo-key')
        .field('prompt', '现代暖木风彩平')
        .field('width', '1600')
        .field('height', '1600')
        .attach('file', Buffer.from('floorplan'), 'floorplan.png');

      expect(executeResponse.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 30));

      const publicResultResponse = await request(app)
        .get(`/api/tasks/${executeResponse.body.taskId}/result`)
        .set('x-runninghub-api-key', 'demo-key');

      expect(publicResultResponse.status).toBe(200);
      expect(publicResultResponse.body).toEqual(
        expect.objectContaining({
          taskId: executeResponse.body.taskId,
          state: 'succeeded',
          outputUrls: ['https://example.com/floorplan-result.png'],
          outputs: [
            expect.objectContaining({
              fileUrl: 'https://example.com/floorplan-result.png',
              taskCostTime: 18,
            }),
          ],
        }),
      );

      const recentResponse = await request(app).get('/api/admin/tasks').set('Cookie', cookie);
      expect(recentResponse.status).toBe(200);
      expect(recentResponse.body.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            taskNo: expect.stringMatching(/^TASK-/),
            upstreamTaskId: 'upstream-1001',
            displayName: '一键彩平',
            appSlug: 'floorplan-colorize',
            events: expect.any(Array),
          }),
        ]),
      );

      const filteredResponse = await request(app)
        .get('/api/admin/tasks')
        .set('Cookie', cookie)
        .query({
          upstreamTaskId: 'upstream-1001',
        });

      expect(filteredResponse.status).toBe(200);
      expect(filteredResponse.body.tasks).toHaveLength(1);
      expect(filteredResponse.body.tasks[0]).toEqual(
        expect.objectContaining({
          upstreamTaskId: 'upstream-1001',
          apiKeyMasked: expect.any(String),
        }),
      );
    } finally {
      await database.close();
    }
  });
});
