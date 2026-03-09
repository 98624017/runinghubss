import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { ServerEnv } from '../config/env.js';
import { createTestDatabase } from '../db/testDatabase.js';
import { createApp } from '../app.js';

function createMockClient() {
  return {
    checkAccount: vi.fn(async () => ({ code: 0, data: { remainCoins: '100' } })),
    uploadFile: vi.fn(async () => ({ code: 0, data: { fileName: 'openapi/demo.png' } })),
    runAiApp: vi.fn(async () => ({ code: 0, data: { taskId: '42' } })),
    queryStatus: vi.fn(async () => ({ code: 0, data: { status: 'RUNNING' } })),
    queryOutputs: vi.fn(async () => ({ code: 804, data: null })),
  };
}

function createAdminEnv(): ServerEnv {
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

describe('admin apps routes', () => {
  it('应支持后台创建应用、发布 schema、更新配置并同步到公开应用列表', async () => {
    const database = await createTestDatabase();
    const app = createApp(createMockClient() as any, {
      env: createAdminEnv(),
      pool: database.pool as any,
    });

    try {
      const loginResponse = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'change-me',
      });
      const cookie = loginResponse.headers['set-cookie']?.[0];
      expect(cookie).toBeTruthy();

      const createResponse = await request(app)
        .post('/api/admin/apps')
        .set('Cookie', cookie)
        .send({
          slug: 'one-click-color',
          displayName: '一键彩平',
          subtitle: '快速生成彩平图',
          description: '将平面线稿转换为彩平效果图。',
          coverImageUrl: 'https://example.com/cover.png',
          tags: ['彩平', '室内设计'],
          sortOrder: 10,
          isEnabled: true,
          usageTips: ['建议上传清晰平面图'],
          resultTips: ['结果链接可能失效，请及时下载'],
          upstreamAppId: '1994388299756212225',
          instanceType: 'default',
          usePersonalQueue: false,
          pollIntervalMs: 5000,
          maxPollAttempts: 60,
          timeoutSeconds: 600,
          maxConcurrencyPerKey: 2,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.app).toEqual(
        expect.objectContaining({
          slug: 'one-click-color',
          displayName: '一键彩平',
          timeoutSeconds: 600,
        }),
      );

      const appId = createResponse.body.app.id as number;

      const schemaResponse = await request(app)
        .post(`/api/admin/apps/${appId}/schema`)
        .set('Cookie', cookie)
        .send({
          schemaVersion: 1,
          layoutSchema: {
            sections: [{ key: 'inputs', title: '输入区' }],
          },
          fieldSchema: {
            fields: [
              {
                key: 'file',
                label: '上传平面图',
                type: 'file',
                description: '上传待处理素材',
                required: true,
                accept: 'image/*',
                nodeId: '257',
                fieldName: 'image',
              },
            ],
          },
          resultSchema: {
            sections: [{ key: 'results', title: '结果区' }],
          },
          isPublished: true,
        });

      expect(schemaResponse.status).toBe(200);
      expect(schemaResponse.body.schema).toEqual(
        expect.objectContaining({
          appId,
          schemaVersion: 1,
          isPublished: true,
        }),
      );

      const updateResponse = await request(app)
        .patch(`/api/admin/apps/${appId}`)
        .set('Cookie', cookie)
        .send({
          displayName: '新版一键彩平',
          timeoutSeconds: 900,
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.app).toEqual(
        expect.objectContaining({
          displayName: '新版一键彩平',
          timeoutSeconds: 900,
        }),
      );

      const publicResponse = await request(app).get('/api/apps');

      expect(publicResponse.status).toBe(200);
      expect(publicResponse.body.apps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1994388299756212225',
            title: '新版一键彩平',
            shortTitle: '快速生成彩平图',
            fields: [
              expect.objectContaining({
                key: 'file',
                label: '上传平面图',
                nodeId: '257',
                fieldName: 'image',
              }),
            ],
          }),
        ]),
      );

      const disableResponse = await request(app)
        .patch(`/api/admin/apps/${appId}`)
        .set('Cookie', cookie)
        .send({
          isEnabled: false,
        });

      expect(disableResponse.status).toBe(200);

      const hiddenResponse = await request(app).get('/api/apps');
      expect(hiddenResponse.status).toBe(200);
      expect(hiddenResponse.body.apps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1994388299756212225',
            slug: 'color-plan',
            title: '一键彩平',
            shortTitle: '一键彩平',
          }),
        ]),
      );
    } finally {
      await database.close();
    }
  });
});
