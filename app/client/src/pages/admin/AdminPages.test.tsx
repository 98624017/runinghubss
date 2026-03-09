import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../App';

function createFetchMock() {
  let isLoggedIn = false;

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;

    if (url === '/api/site/config') {
      return new Response(
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
      );
    }

    if (url === '/api/apps') {
      return new Response(JSON.stringify({ ok: true, apps: [] }), { status: 200 });
    }

    if (url === '/api/history?apiKey=demo-key') {
      return new Response(JSON.stringify({ ok: true, tasks: [] }), { status: 200 });
    }

    if (url === '/api/admin/auth/me') {
      if (!isLoggedIn) {
        return new Response(JSON.stringify({ ok: false, message: '未登录' }), { status: 401 });
      }
      return new Response(
        JSON.stringify({
          ok: true,
          admin: {
            id: 1,
            username: 'admin',
          },
        }),
        { status: 200 },
      );
    }

    if (url === '/api/admin/auth/login') {
      isLoggedIn = true;
      return new Response(
        JSON.stringify({
          ok: true,
          admin: {
            id: 1,
            username: 'admin',
          },
        }),
        { status: 200 },
      );
    }

    if (url === '/api/admin/apps' && init?.method === undefined) {
      return new Response(
        JSON.stringify({
          ok: true,
          apps: [
            {
              id: 1,
              slug: 'floorplan-color',
              displayName: '一键彩平',
              subtitle: '快速彩平',
              description: '将平面白图转换为彩平效果图。',
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
              timeoutSeconds: 600,
              maxConcurrencyPerKey: 1,
              publishedSchema: {
                schemaVersion: 2,
                layoutSchema: {
                  sections: [{ key: 'inputs', title: '素材上传', sortOrder: 1 }],
                },
                fieldSchema: {
                  fields: [
                    {
                      key: 'file',
                      label: '上传平面图',
                      type: 'file',
                      description: '上传平面白图',
                      required: true,
                      sectionKey: 'inputs',
                      sortOrder: 1,
                      nodeId: '257',
                      fieldName: 'image',
                    },
                  ],
                },
                resultSchema: {
                  sections: [{ key: 'results', title: '结果说明', description: '及时下载' }],
                },
              },
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url === '/api/admin/apps/1' && init?.method === 'PATCH') {
      const payload = JSON.parse(String(init?.body ?? '{}'));
      return new Response(
        JSON.stringify({
          ok: true,
          app: {
            id: 1,
            slug: 'floorplan-color',
            displayName: payload.displayName ?? '一键彩平',
            timeoutSeconds: payload.timeoutSeconds ?? 900,
          },
        }),
        { status: 200 },
      );
    }

    if (url === '/api/admin/apps/1/schema' && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          ok: true,
          schema: {
            id: 3,
            appId: 1,
            schemaVersion: 3,
            isPublished: true,
          },
        }),
        { status: 200 },
      );
    }

    if (url === '/api/admin/tasks') {
      return new Response(JSON.stringify({ ok: true, tasks: [] }), { status: 200 });
    }

    throw new Error(`未模拟的请求：${url} ${init?.method ?? 'GET'}`);
  });
}

describe('Admin pages', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/admin/login');
  });

  it('应支持后台登录并保存应用配置', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<App />);

    await user.type(await screen.findByLabelText('用户名'), 'admin');
    await user.type(screen.getByLabelText('密码'), 'change-me');
    await user.click(screen.getByRole('button', { name: '登录后台' }));

    expect(await screen.findByRole('heading', { name: '应用管理' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '返回用户界面' })).toHaveAttribute('href', '/');
    await waitFor(() => {
      expect(screen.getByText('当前选中：一键彩平')).toBeInTheDocument();
    });
    await user.clear(screen.getByLabelText('总体超时时间（秒）'));
    await user.type(screen.getByLabelText('总体超时时间（秒）'), '900');
    await user.click(screen.getByRole('button', { name: '保存应用' }));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([input, init]) =>
          (typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url) ===
            '/api/admin/apps/1' && init?.method === 'PATCH',
      );
      expect(patchCall).toBeTruthy();
      const payload = JSON.parse(String(patchCall?.[1]?.body ?? '{}'));
      expect(payload).toEqual(
        expect.objectContaining({
          displayName: '一键彩平',
          timeoutSeconds: 900,
        }),
      );
    });
  });
});
