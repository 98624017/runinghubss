import { beforeEach, describe, expect, it, vi } from 'vitest';

const listAppsMock = vi.fn();
const listPublishedAppsMock = vi.fn();

vi.mock('../repositories/appRepository.js', () => ({
  createAppRepository: vi.fn(() => ({
    listApps: listAppsMock,
    listPublishedApps: listPublishedAppsMock,
  })),
}));

import { createAppCatalog } from './appCatalog.js';

describe('appCatalog', () => {
  beforeEach(() => {
    listAppsMock.mockReset();
    listPublishedAppsMock.mockReset();
  });

  it('应只对外暴露约定的四个公开应用，并忽略数据库中的旧公开应用', async () => {
    listAppsMock.mockResolvedValue([
      {
        id: 1,
        upstreamAppId: '2011111632956563457',
      },
      {
        id: 2,
        upstreamAppId: '1994388299756212225',
      },
    ]);

    listPublishedAppsMock.mockResolvedValue([
      {
        id: 1,
        slug: 'upscale-fast',
        displayName: '高清放大',
        subtitle: '高清放大',
        description: '旧公开应用，不应继续展示在前台。',
        coverImageUrl: null,
        tags: ['旧应用'],
        sortOrder: 1,
        isEnabled: true,
        usageTips: ['不应展示'],
        resultTips: ['不应展示'],
        upstreamAppId: '2011111632956563457',
        instanceType: 'default',
        usePersonalQueue: false,
        pollIntervalMs: 5000,
        maxPollAttempts: 60,
        timeoutSeconds: 600,
        maxConcurrencyPerKey: 1,
        publishedSchema: {
          id: 1,
          appId: 1,
          schemaVersion: 1,
          layoutSchema: { sections: [{ key: 'legacy', title: '旧配置' }] },
          fieldSchema: { fields: [{ key: 'file', type: 'file' }] },
          resultSchema: { sections: [{ key: 'legacy', title: '旧结果' }] },
          isPublished: true,
        },
      },
      {
        id: 2,
        slug: 'floorplan-color',
        displayName: '一键彩平 Pro',
        subtitle: '彩平增强版',
        description: '来自后台已发布 schema 的公开彩平应用。',
        coverImageUrl: null,
        tags: ['彩平', '方案汇报'],
        sortOrder: 2,
        isEnabled: true,
        usageTips: ['上传清晰平面图'],
        resultTips: ['结果链接可能失效，请及时下载'],
        upstreamAppId: '1994388299756212225',
        instanceType: 'default',
        usePersonalQueue: false,
        pollIntervalMs: 5000,
        maxPollAttempts: 60,
        timeoutSeconds: 900,
        maxConcurrencyPerKey: 2,
        publishedSchema: {
          id: 2,
          appId: 2,
          schemaVersion: 3,
          layoutSchema: { sections: [{ key: 'inputs', title: '素材上传' }] },
          fieldSchema: { fields: [{ key: 'file', label: '上传平面图', type: 'file' }] },
          resultSchema: { sections: [{ key: 'result', title: '结果说明' }] },
          isPublished: true,
        },
      },
    ]);

    const catalog = createAppCatalog({} as any);
    const apps = await catalog.listPublicApps();

    expect(apps.map((app) => app.id)).toEqual([
      '1994388299756212225',
      '1986819253754130433',
      '2003678561775067138',
      '2023563076041183233',
    ]);
    expect(apps.map((app) => app.slug)).toEqual([
      'color-plan',
      'exterior-transfer',
      'floorplan-to-render',
      'rough-to-render',
    ]);
    expect(apps[0]).toEqual(
      expect.objectContaining({
        title: '一键彩平 Pro',
        shortTitle: '彩平增强版',
        description: '来自后台已发布 schema 的公开彩平应用。',
        chips: ['彩平', '方案汇报'],
      }),
    );
    expect(apps[0].layoutSchema).toEqual({ sections: [{ key: 'inputs', title: '素材上传' }] });
    expect(apps[0].fields).toEqual([{ key: 'file', label: '上传平面图', type: 'file' }]);
    expect(apps.some((app) => app.id === '2011111632956563457')).toBe(false);
  });
});
