import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../app.js';
import { createTestDatabase } from '../db/testDatabase.js';
import { createApiKeyArchiveRepository } from '../repositories/apiKeyArchiveRepository.js';
import { createSystemConfigRepository } from '../repositories/systemConfigRepository.js';
import { hashApiKey } from '../services/balanceDisplay.js';

function createMockClient() {
  return {
    checkAccount: vi.fn(async () => ({
      code: 0,
      data: {
        remainCoins: '10',
        currentTaskCounts: '0',
        apiType: 'NORMAL',
      },
    })),
    uploadFile: vi.fn(async () => ({ code: 0, data: { fileName: 'openapi/demo.png' } })),
    runAiApp: vi.fn(async () => ({ code: 0, data: { taskId: '42' } })),
    queryStatus: vi.fn(async () => ({ code: 0, data: { status: 'RUNNING' } })),
    queryOutputs: vi.fn(async () => ({ code: 804, data: null })),
  };
}

describe('site routes', () => {
  it('应返回白牌站点配置与默认展示倍率', async () => {
    const database = await createTestDatabase();
    const systemConfigRepository = createSystemConfigRepository(database.pool as any);

    await systemConfigRepository.upsertConfig({
      key: 'site.branding',
      value: {
        brandName: '设计云台',
        heroTitle: '室内设计 AI 出图平台',
        heroSubtitle: '让设计工作室更快出图',
      },
    });
    await systemConfigRepository.upsertConfig({
      key: 'site.defaults',
      value: {
        defaultDisplayMultiplier: 1.5,
        resultLinkNotice: '结果链接可能失效，请及时下载',
      },
    });
    await systemConfigRepository.upsertConfig({
      key: 'site.marketing',
      value: {
        customerSummaryTitle: '客户定位',
        customerSummaryText: '面向室内设计与软装团队的白牌出图工作台。',
        targetAudienceTitle: '适用角色',
        targetAudience: ['设计工作室', '软装团队', '独立设计师'],
        solutionHighlightsTitle: '核心亮点',
        solutionHighlights: [
          {
            title: '白牌交付',
            description: '前台不暴露真实上游服务，统一以自有品牌对外交付。',
            tag: 'Brand',
          },
        ],
        workflowTitle: '交付流程',
        workflowSteps: ['配置密钥', '进入工作台', '下载结果'],
        referenceGalleryTitle: '客户参考物料',
        referenceGallery: [
          {
            title: '一站式全屋家具解决方案',
            description: '来自客户宣传物料封面，用于首页宣传参考。',
            imageUrl: '/customer-brief/page-01-cover.png',
            badge: 'Cover',
          },
        ],
      },
    });

    const app = createApp(createMockClient() as any, {
      pool: database.pool as any,
    });

    try {
      const response = await request(app).get('/api/site/config');

      expect(response.status).toBe(200);
      expect(response.body.site).toEqual({
        brandName: '设计云台',
        heroTitle: '室内设计 AI 出图平台',
        heroSubtitle: '让设计工作室更快出图',
        defaultDisplayMultiplier: 1.5,
        resultLinkNotice: '结果链接可能失效，请及时下载',
        customerSummaryTitle: '客户定位',
        customerSummaryText: '面向室内设计与软装团队的白牌出图工作台。',
        targetAudienceTitle: '适用角色',
        targetAudience: ['设计工作室', '软装团队', '独立设计师'],
        solutionHighlightsTitle: '核心亮点',
        solutionHighlights: [
          {
            title: '白牌交付',
            description: '前台不暴露真实上游服务，统一以自有品牌对外交付。',
            tag: 'Brand',
          },
        ],
        workflowTitle: '交付流程',
        workflowSteps: ['配置密钥', '进入工作台', '下载结果'],
        referenceGalleryTitle: '客户参考物料',
        referenceGallery: [
          {
            title: '一站式全屋家具解决方案',
            description: '来自客户宣传物料封面，用于首页宣传参考。',
            imageUrl: '/customer-brief/page-01-cover.png',
            badge: 'Cover',
          },
        ],
      });
    } finally {
      await database.close();
    }
  });

  it('账户检查应返回换算额度，并优先使用单 key 倍率', async () => {
    const database = await createTestDatabase();
    const systemConfigRepository = createSystemConfigRepository(database.pool as any);
    const archiveRepository = createApiKeyArchiveRepository(database.pool as any);
    const apiKey = 'demo-key';
    const apiKeyHash = hashApiKey(apiKey);

    await systemConfigRepository.upsertConfig({
      key: 'site.defaults',
      value: {
        defaultDisplayMultiplier: 1.5,
      },
    });

    const app = createApp(createMockClient() as any, {
      pool: database.pool as any,
    });

    try {
      const firstResponse = await request(app).post('/api/account/check').send({ apiKey });

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body.balance).toEqual(
        expect.objectContaining({
          rawBalance: '10',
          displayBalance: '15',
          displayMultiplier: 1.5,
        }),
      );

      const archive = await archiveRepository.findByHash(apiKeyHash);
      expect(archive?.lastCheckedDisplayBalance).toBe('15');

      await archiveRepository.updateBalanceSnapshot({
        archiveId: archive!.id,
        displayMultiplier: 2.2,
        lastCheckedBalance: '10',
        lastCheckedDisplayBalance: '22',
        status: 'ready',
      });

      const secondResponse = await request(app).post('/api/account/check').send({ apiKey });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.balance).toEqual(
        expect.objectContaining({
          rawBalance: '10',
          displayBalance: '22',
          displayMultiplier: 2.2,
        }),
      );
    } finally {
      await database.close();
    }
  });
});
