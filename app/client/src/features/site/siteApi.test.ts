import { describe, expect, it, vi } from 'vitest';

import { fetchPublicBootstrap } from './siteApi';

describe('siteApi', () => {
  it('应同时加载站点配置与应用清单', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;

      if (url === '/api/site/config') {
        return new Response(
          JSON.stringify({
            ok: true,
            site: {
              brandName: '设计云台',
              heroTitle: '室内设计 AI 出图平台',
              heroSubtitle: '让设计工作室更快出图',
              defaultDisplayMultiplier: 1.5,
              resultLinkNotice: '结果链接可能失效，请及时下载',
              customerSummaryTitle: '客户定位',
              customerSummaryText: '面向室内设计团队的白牌出图平台。',
              targetAudienceTitle: '适用角色',
              targetAudience: ['设计工作室', '软装团队'],
              solutionHighlightsTitle: '核心亮点',
              solutionHighlights: [
                {
                  title: '白牌交付',
                  description: '统一品牌出口，不暴露真实上游。',
                  tag: 'Brand',
                },
              ],
              workflowTitle: '推荐流程',
              workflowSteps: ['校验额度', '进入工作台', '下载成果'],
              referenceGalleryTitle: '客户参考物料',
              referenceGallery: [
                {
                  title: '系统 1 分钟后效果图',
                  description: '来自客户资料的效果参考页。',
                  imageUrl: '/customer-brief/page-04-ai-result.png',
                  badge: 'Preview',
                },
              ],
            },
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          apps: [
            {
              id: '1994388299756212225',
              slug: 'color-plan',
              title: '一键彩平',
              shortTitle: '一键彩平',
              description: '将平面白图转换为彩平效果图。',
              chips: ['彩平'],
              notes: ['适合方案初稿'],
              nodeSummary: [],
              fields: [],
            },
          ],
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const payload = await fetchPublicBootstrap();

    expect(payload.site.brandName).toBe('设计云台');
    expect(payload.site.customerSummaryTitle).toBe('客户定位');
    expect(payload.site.solutionHighlights?.[0]?.title).toBe('白牌交付');
    expect(payload.site.referenceGalleryTitle).toBe('客户参考物料');
    expect(payload.site.referenceGallery?.[0]?.imageUrl).toBe('/customer-brief/page-04-ai-result.png');
    expect(payload.apps[0]?.slug).toBe('color-plan');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/site/config');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/apps');
  });
});
