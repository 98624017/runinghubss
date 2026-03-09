import { afterEach, describe, expect, it } from 'vitest';

import { listPublicSupportedApps } from '../config/apps.js';
import { createAppRepository } from '../repositories/appRepository.js';
import { ensureBundledApps } from './bootstrap.js';
import { createTestDatabase } from './testDatabase.js';

describe('ensureBundledApps', () => {
  const openedPools: Array<{ end(): Promise<void> }> = [];

  afterEach(async () => {
    while (openedPools.length > 0) {
      const pool = openedPools.pop();
      if (pool) {
        await pool.end();
      }
    }
  });

  it('应为迁移后的空数据库补齐默认应用与已发布 schema', async () => {
    const database = await createTestDatabase();
    openedPools.push(database.pool);

    const repository = createAppRepository(database.pool);
    expect(await repository.listApps()).toHaveLength(0);

    await ensureBundledApps(database.pool);

    const apps = await repository.listApps();
    const publishedApps = await repository.listPublishedApps();
    const supportedApps = listPublicSupportedApps();

    expect(apps).toHaveLength(supportedApps.length);
    expect(publishedApps).toHaveLength(supportedApps.length);
    expect(
      publishedApps.find((app) => app.upstreamAppId === '2003678561775067138'),
    ).toEqual(
      expect.objectContaining({
        displayName: '平面转效果',
        subtitle: '平面转效果',
        publishedSchema: expect.objectContaining({
          isPublished: true,
          layoutSchema: expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({ key: 'brief' }),
              expect.objectContaining({ key: 'materials' }),
              expect.objectContaining({ key: 'references' }),
            ]),
          }),
          fieldSchema: expect.objectContaining({
            fields: expect.arrayContaining([
              expect.objectContaining({
                key: 'planImage',
                label: '平面图',
              }),
              expect.objectContaining({
                key: 'prompt',
                label: '生成说明',
              }),
            ]),
          }),
        }),
      }),
    );
  });

  it('应修正旧版本残留的公开应用配置并下架内部默认应用', async () => {
    const database = await createTestDatabase();
    openedPools.push(database.pool);

    const repository = createAppRepository(database.pool);

    const legacyInternalApp = await repository.createApp({
      slug: 'upscale-fast',
      displayName: '高清放大-极速',
      subtitle: '极速高清放大',
      description: '旧版默认公开应用',
      coverImageUrl: null,
      tags: ['内部'],
      sortOrder: 1,
      isEnabled: true,
      usageTips: ['旧提示'],
      resultTips: [],
      upstreamAppId: '2011111632956563457',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 3000,
      maxPollAttempts: 20,
      timeoutSeconds: 180,
      maxConcurrencyPerKey: 1,
    });

    await repository.saveSchema({
      appId: legacyInternalApp.id,
      schemaVersion: 1,
      layoutSchema: { sections: [{ key: 'basic', title: '旧版参数' }] },
      fieldSchema: { fields: [{ key: 'file', type: 'file', label: '上传图片' }] },
      resultSchema: { sections: [{ key: 'result', title: '结果' }] },
      isPublished: true,
    });

    const legacyPublicApp = await repository.createApp({
      slug: '1994388299756212225',
      displayName: '平面图填色-立体版',
      subtitle: '平面图填色-立体版',
      description: '旧版公开标题',
      coverImageUrl: null,
      tags: ['旧版'],
      sortOrder: 2,
      isEnabled: true,
      usageTips: ['旧公开应用'],
      resultTips: [],
      upstreamAppId: '1994388299756212225',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 3000,
      maxPollAttempts: 20,
      timeoutSeconds: 180,
      maxConcurrencyPerKey: 1,
    });

    await repository.saveSchema({
      appId: legacyPublicApp.id,
      schemaVersion: 1,
      layoutSchema: { sections: [{ key: 'basic', title: '旧版参数' }] },
      fieldSchema: {
        fields: [
          { key: 'file', type: 'file', label: '平面白图' },
          { key: 'prompt', type: 'text', label: '立体化提示词' },
        ],
      },
      resultSchema: { sections: [{ key: 'result', title: '结果' }] },
      isPublished: true,
    });

    await ensureBundledApps(database.pool);

    const apps = await repository.listApps();
    const publishedApps = await repository.listPublishedApps();

    expect(
      apps.find((app) => app.upstreamAppId === '2011111632956563457'),
    ).toEqual(
      expect.objectContaining({
        isEnabled: false,
      }),
    );

    expect(
      apps.find((app) => app.upstreamAppId === '1994388299756212225'),
    ).toEqual(
      expect.objectContaining({
        slug: 'color-plan',
        displayName: '一键彩平',
        subtitle: '一键彩平',
        isEnabled: true,
      }),
    );

    expect(publishedApps.map((app) => app.upstreamAppId)).toEqual([
      '1994388299756212225',
      '1986819253754130433',
      '2003678561775067138',
      '2023563076041183233',
    ]);
  });

  it('应在存在更高未发布 schema 版本时继续刷新默认 schema', async () => {
    const database = await createTestDatabase();
    openedPools.push(database.pool);

    const repository = createAppRepository(database.pool);
    const legacyPublicApp = await repository.createApp({
      slug: '1994388299756212225',
      displayName: '平面图填色-立体版',
      subtitle: '平面图填色-立体版',
      description: '旧版公开标题',
      coverImageUrl: null,
      tags: ['旧版'],
      sortOrder: 1,
      isEnabled: true,
      usageTips: ['旧公开应用'],
      resultTips: [],
      upstreamAppId: '1994388299756212225',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 3000,
      maxPollAttempts: 20,
      timeoutSeconds: 180,
      maxConcurrencyPerKey: 1,
    });

    await repository.saveSchema({
      appId: legacyPublicApp.id,
      schemaVersion: 2,
      layoutSchema: { sections: [{ key: 'basic', title: '旧版参数' }] },
      fieldSchema: {
        fields: [
          { key: 'file', type: 'file', label: '平面白图' },
          { key: 'prompt', type: 'text', label: '立体化提示词' },
        ],
      },
      resultSchema: { sections: [{ key: 'result', title: '结果' }] },
      isPublished: true,
    });

    await repository.saveSchema({
      appId: legacyPublicApp.id,
      schemaVersion: 3,
      layoutSchema: { sections: [{ key: 'draft', title: '草稿版本' }] },
      fieldSchema: {
        fields: [{ key: 'file', type: 'file', label: '临时图片' }],
      },
      resultSchema: { sections: [{ key: 'result', title: '结果' }] },
      isPublished: false,
    });

    await ensureBundledApps(database.pool);

    const refreshedApps = await repository.listPublishedApps();
    const refreshedApp = refreshedApps.find((app) => app.upstreamAppId === '1994388299756212225');

    expect(refreshedApp).toEqual(
      expect.objectContaining({
        slug: 'color-plan',
        displayName: '一键彩平',
        publishedSchema: expect.objectContaining({
          schemaVersion: 4,
          isPublished: true,
        }),
      }),
    );
  });
});
