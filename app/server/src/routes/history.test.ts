import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { ServerEnv } from '../config/env.js';
import { createTestDatabase } from '../db/testDatabase.js';
import { createApp } from '../app.js';
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

describe('history routes', () => {
  it('应支持本地任务提交、状态/结果查询与按 apiKey 查询历史', async () => {
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
      const executeResponse = await request(app)
        .post('/api/apps/1994388299756212225/execute')
        .field('apiKey', 'demo-key')
        .field('prompt', '现代暖木风彩平')
        .field('width', '1600')
        .field('height', '1600')
        .attach('file', Buffer.from('floorplan'), 'floorplan.png');

      expect(executeResponse.status).toBe(200);
      expect(executeResponse.body.taskId).toMatch(/^TASK-/);

      await new Promise((resolve) => setTimeout(resolve, 20));

      const taskId = executeResponse.body.taskId as string;
      const statusResponse = await request(app).get(`/api/tasks/${taskId}/status`);
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toEqual(
        expect.objectContaining({
          taskId,
          state: 'succeeded',
          outputsReady: true,
        }),
      );

      const resultResponse = await request(app).get(`/api/tasks/${taskId}/result`);
      expect(resultResponse.status).toBe(200);
      expect(resultResponse.body).toEqual(
        expect.objectContaining({
          taskId,
          state: 'succeeded',
          outputUrls: ['https://example.com/floorplan-result.png'],
          taskCostTime: 18,
        }),
      );

      const historyResponse = await request(app).get('/api/history').query({
        apiKey: 'demo-key',
      });

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            taskId,
            appSlug: 'floorplan-colorize',
            displayName: '一键彩平',
            status: 'succeeded',
            linkExpiryReminder: '结果链接可能失效，请及时下载',
          }),
        ]),
      );
    } finally {
      await database.close();
    }
  });
});
