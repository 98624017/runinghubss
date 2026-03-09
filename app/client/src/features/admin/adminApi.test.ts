import { describe, expect, it, vi } from 'vitest';

import {
  changeAdminPassword,
  createAdminApp,
  fetchAdminSiteConfig,
  fetchAdminMe,
  listAdminApps,
  loginAdmin,
  saveAppSchema,
  searchAdminTasks,
  uploadAdminSiteAsset,
  updateAdminSiteConfig,
  updateAdminApp,
} from './adminApi';

describe('adminApi', () => {
  it('应支持登录、应用 CRUD 与任务检索请求', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            admin: {
              id: 1,
              username: 'admin',
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            admin: {
              id: 1,
              username: 'admin',
              lastLoginAt: '2026-03-08T10:00:00.000Z',
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            apps: [
              {
                id: 1,
                slug: 'floorplan-color',
                displayName: '一键彩平',
                subtitle: '快速生成彩平图',
                description: '将平面白图转换为彩平图。',
                coverImageUrl: null,
                tags: ['彩平'],
                sortOrder: 1,
                isEnabled: true,
                usageTips: ['建议上传清晰平面图'],
                resultTips: ['结果链接可能失效，请及时下载'],
                upstreamAppId: '1994388299756212225',
                instanceType: 'default',
                usePersonalQueue: false,
                pollIntervalMs: 3000,
                maxPollAttempts: 20,
                timeoutSeconds: 180,
                maxConcurrencyPerKey: 1,
                publishedSchema: null,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            app: {
              id: 2,
              slug: 'new-app',
              displayName: '新应用',
              subtitle: '测试',
              description: '测试应用',
              coverImageUrl: null,
              tags: [],
              sortOrder: 2,
              isEnabled: true,
              usageTips: [],
              resultTips: [],
              upstreamAppId: '2000000000000000001',
              instanceType: 'default',
              usePersonalQueue: false,
              pollIntervalMs: 3000,
              maxPollAttempts: 20,
              timeoutSeconds: 300,
              maxConcurrencyPerKey: 1,
            },
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            app: {
              id: 2,
              slug: 'new-app',
              displayName: '新应用（已更新）',
              subtitle: '测试',
              description: '测试应用',
              coverImageUrl: null,
              tags: [],
              sortOrder: 2,
              isEnabled: true,
              usageTips: [],
              resultTips: [],
              upstreamAppId: '2000000000000000001',
              instanceType: 'default',
              usePersonalQueue: false,
              pollIntervalMs: 5000,
              maxPollAttempts: 40,
              timeoutSeconds: 600,
              maxConcurrencyPerKey: 2,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            schema: {
              id: 10,
              appId: 2,
              schemaVersion: 3,
              layoutSchema: {
                sections: [{ key: 'inputs', title: '输入区' }],
              },
              fieldSchema: {
                fields: [
                  {
                    key: 'file',
                    label: '上传图片',
                    type: 'file',
                    description: '上传素材',
                    required: true,
                    sectionKey: 'inputs',
                  },
                ],
              },
              resultSchema: {
                sections: [{ key: 'results', title: '结果区' }],
              },
              isPublished: true,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            tasks: [
              {
                id: 9,
                taskNo: 'TASK-9',
                appSlug: 'floorplan-color',
                displayName: '一键彩平',
                status: 'succeeded',
                upstreamTaskId: 'upstream-9',
                apiKeyHash: 'hash-1',
                apiKeyMasked: 'sk-***',
                events: [],
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    await loginAdmin({
      username: 'admin',
      password: 'change-me',
    });
    await fetchAdminMe();
    await listAdminApps();
    await createAdminApp({
      slug: 'new-app',
      displayName: '新应用',
      subtitle: '测试',
      description: '测试应用',
      coverImageUrl: '',
      tagsText: '',
      sortOrder: 2,
      isEnabled: true,
      usageTipsText: '',
      resultTipsText: '',
      upstreamAppId: '2000000000000000001',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 3000,
      maxPollAttempts: 20,
      timeoutSeconds: 300,
      maxConcurrencyPerKey: 1,
    });
    await updateAdminApp(2, {
      displayName: '新应用（已更新）',
      timeoutSeconds: 600,
      maxPollAttempts: 40,
      pollIntervalMs: 5000,
      maxConcurrencyPerKey: 2,
    });
    await saveAppSchema(2, {
      schemaVersion: 3,
      timeoutSeconds: 600,
      layoutSchema: {
        sections: [{ key: 'inputs', title: '输入区' }],
      },
      fieldSchema: {
        fields: [
          {
            key: 'file',
            label: '上传图片',
            type: 'file',
            description: '上传素材',
            required: true,
            sectionKey: 'inputs',
          },
        ],
      },
      resultSchema: {
        sections: [{ key: 'results', title: '结果区' }],
      },
      isPublished: true,
    });
    const tasks = await searchAdminTasks({
      taskNo: 'TASK-9',
      upstreamTaskId: 'upstream-9',
      apiKeyHash: 'hash-1',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/admin/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin/auth/me',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/admin/apps',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      '/api/admin/tasks?taskNo=TASK-9&upstreamTaskId=upstream-9&apiKeyHash=hash-1',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(tasks[0]).toEqual(
      expect.objectContaining({
        taskNo: 'TASK-9',
        upstreamTaskId: 'upstream-9',
        apiKeyHash: 'hash-1',
      }),
    );
  });

  it('应支持读取并保存站点宣传配置', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            site: {
              brandName: '设计云台',
              heroTitle: '室内设计 AI 出图平台',
              heroSubtitle: '让设计工作室更快出图',
              defaultDisplayMultiplier: 1,
              resultLinkNotice: '结果链接可能失效，请及时下载',
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
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            site: {
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
            },
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const site = await fetchAdminSiteConfig();
    const updated = await updateAdminSiteConfig({
      ...site,
      brandName: '空间设计云台',
      heroTitle: '面向室内设计团队的 AI 出图平台',
      heroSubtitle: '把客户沟通、快速出图和白牌交付放到同一个控制台',
      defaultDisplayMultiplier: 1.8,
      resultLinkNotice: '生成完成后请及时下载成果图',
    });

    expect(site.customerSummaryTitle).toBe('客户资料摘要');
    expect(updated.brandName).toBe('空间设计云台');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/admin/site',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin/site',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
      }),
    );
  });

  it('应支持后台上传站点参考图', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          asset: {
            fileName: 'reference-demo.png',
            url: 'http://127.0.0.1:8787/site-assets/reference-demo.png',
          },
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['image-demo'], 'reference-demo.png', { type: 'image/png' });
    const asset = await uploadAdminSiteAsset(file);

    expect(asset.url).toBe('http://127.0.0.1:8787/site-assets/reference-demo.png');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/site/assets',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.any(FormData),
      }),
    );
  });

  it('应支持管理员修改密码', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          message: '管理员密码已更新',
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await changeAdminPassword({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/auth/change-password',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      }),
    );
  });

  it('应支持检索与更新单独 API Key 倍率', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            archives: [
              {
                id: 8,
                apiKeyHash: 'hash-demo-key',
                apiKeyMasked: 'rk-***-demo',
                displayMultiplier: 2.2,
                lastCheckedBalance: '20',
                lastCheckedDisplayBalance: '44',
                lastCheckedAt: '2026-03-09T10:00:00.000Z',
                status: 'active',
                createdAt: '2026-03-09T09:00:00.000Z',
                updatedAt: '2026-03-09T10:00:00.000Z',
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            archive: {
              id: 8,
              apiKeyHash: 'hash-demo-key',
              apiKeyMasked: 'rk-***-demo',
              displayMultiplier: 3.5,
              lastCheckedBalance: '20',
              lastCheckedDisplayBalance: '70',
              lastCheckedAt: '2026-03-09T10:30:00.000Z',
              status: 'active',
              createdAt: '2026-03-09T09:00:00.000Z',
              updatedAt: '2026-03-09T10:30:00.000Z',
            },
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const api = await import('./adminApi');
    const listResult = await Promise.resolve().then(() =>
      (api as unknown as {
        listAdminMultipliers: () => Promise<
          Array<{
            id: number;
            apiKeyHash: string;
            apiKeyMasked: string;
            displayMultiplier: number | null;
          }>
        >;
      }).listAdminMultipliers(),
    );
    const updated = await Promise.resolve().then(() =>
      (api as unknown as {
        updateAdminMultiplier: (archiveId: number, displayMultiplier: number) => Promise<{
          id: number;
          displayMultiplier: number | null;
        }>;
      }).updateAdminMultiplier(8, 3.5),
    );

    expect(listResult[0]?.apiKeyMasked).toBe('rk-***-demo');
    expect(updated.displayMultiplier).toBe(3.5);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/admin/multipliers',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin/multipliers/8',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      }),
    );
  });
});
