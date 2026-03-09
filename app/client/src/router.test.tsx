import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

function createFetchMock() {
  return vi.fn(async (input: RequestInfo | URL) => {
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
      );
    }

    if (url === '/api/apps') {
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
              nodeSummary: ['257:image'],
              fields: [],
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url === '/api/history') {
      return new Response(JSON.stringify({ ok: true, tasks: [] }), { status: 200 });
    }

    if (url === '/api/admin/auth/me') {
      return new Response(JSON.stringify({ ok: false, message: '未登录' }), { status: 401 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
}

describe('router', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', createFetchMock());
  });

  it('公共路由使用公共布局', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('public-layout')).toBeInTheDocument();
    });

    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '控制台总览' })).toBeInTheDocument();
    expect(screen.getByText('我的资产')).toBeInTheDocument();
  });

  it('后台路由使用后台布局', async () => {
    window.history.pushState({}, '', '/admin/login');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: '后台登录' })).toBeInTheDocument();
  });
});
