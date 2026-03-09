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

describe('admin site routes', () => {
  it('应支持后台读取并保存站点宣传配置', async () => {
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

      const getResponse = await request(app).get('/api/admin/site').set('Cookie', cookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.site).toEqual(
        expect.objectContaining({
          brandName: '设计云台',
          customerSummaryTitle: '客户资料摘要',
          solutionHighlights: expect.any(Array),
        }),
      );

      const saveResponse = await request(app)
        .patch('/api/admin/site')
        .set('Cookie', cookie)
        .send({
          brandName: '空间设计云台',
          heroTitle: '面向室内设计团队的 AI 出图平台',
          heroSubtitle: '把客户沟通、快速出图和白牌交付放到同一个控制台',
          defaultDisplayMultiplier: 1.8,
          resultLinkNotice: '生成完成后请及时下载成果图',
          customerSummaryTitle: '客户资料摘要',
          customerSummaryText: '聚焦室内设计、软装提案与方案汇报的白牌交付场景。',
          targetAudienceTitle: '适用对象',
          targetAudience: ['设计公司', '软装团队'],
          solutionHighlightsTitle: '宣传亮点',
          solutionHighlights: [
            {
              title: '客户资料驱动',
              description: '首页文案和亮点区块可以按客户业务资料动态维护。',
              tag: 'Brief',
            },
          ],
          workflowTitle: '推荐流程',
          workflowSteps: ['校验额度', '上传素材', '回看与下载'],
          referenceGalleryTitle: '客户参考物料',
          referenceGallery: [
            {
              title: '系统 1 分钟后效果图',
              description: '用于首页展示客户资料里的效果参考。',
              imageUrl: '/customer-brief/page-04-ai-result.png',
              badge: 'Preview',
            },
          ],
        });

      expect(saveResponse.status).toBe(200);
      expect(saveResponse.body.site).toEqual(
        expect.objectContaining({
          brandName: '空间设计云台',
          customerSummaryTitle: '客户资料摘要',
          targetAudience: ['设计公司', '软装团队'],
          workflowSteps: ['校验额度', '上传素材', '回看与下载'],
          referenceGalleryTitle: '客户参考物料',
          referenceGallery: [
            expect.objectContaining({
              title: '系统 1 分钟后效果图',
              badge: 'Preview',
            }),
          ],
        }),
      );

      const publicResponse = await request(app).get('/api/site/config');
      expect(publicResponse.status).toBe(200);
      expect(publicResponse.body.site).toEqual(
        expect.objectContaining({
          brandName: '空间设计云台',
          heroTitle: '面向室内设计团队的 AI 出图平台',
          solutionHighlights: [
            expect.objectContaining({
              title: '客户资料驱动',
              tag: 'Brief',
            }),
          ],
        }),
      );
    } finally {
      await database.close();
    }
  });

  it('应支持后台上传参考图并返回可访问地址', async () => {
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

      const uploadResponse = await request(app)
        .post('/api/admin/site/assets')
        .set('Cookie', cookie)
        .attach('file', Buffer.from('fake-image-content'), {
          filename: 'reference-demo.png',
          contentType: 'image/png',
        });

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body).toEqual(
        expect.objectContaining({
          ok: true,
          asset: expect.objectContaining({
            url: expect.stringContaining('/site-assets/'),
            fileName: expect.stringMatching(/\.png$/),
          }),
        }),
      );

      const assetUrl = String(uploadResponse.body.asset.url);
      const assetPath = new URL(assetUrl).pathname;
      const assetResponse = await request(app).get(assetPath);

      expect(assetResponse.status).toBe(200);
      expect(assetResponse.header['content-type']).toContain('image/png');
      expect(assetResponse.body).toBeInstanceOf(Buffer);
    } finally {
      await database.close();
    }
  });
});
