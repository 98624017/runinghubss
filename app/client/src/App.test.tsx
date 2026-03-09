import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import App from './App';

function createFetchMock() {
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
              chips: ['彩平', '室内设计'],
              notes: ['适合方案初稿'],
              nodeSummary: ['257:image'],
              fields: [
                {
                  key: 'file',
                  label: '上传平面图',
                  type: 'file',
                  description: '上传待处理的平面白图',
                  required: true,
                  sectionKey: 'inputs',
                },
                {
                  key: 'prompt',
                  label: '风格提示',
                  type: 'text',
                  description: '补充空间风格与材质要求',
                  required: true,
                  defaultValue: '现代暖木风格',
                  sectionKey: 'settings',
                },
                {
                  key: 'width',
                  label: '输出宽度',
                  type: 'text',
                  description: '建议 1600',
                  required: true,
                  defaultValue: '1600',
                  sectionKey: 'settings',
                },
              ],
              layoutSchema: {
                sections: [
                  { key: 'inputs', title: '素材上传' },
                  { key: 'settings', title: '参数设置' },
                ],
              },
              resultSchema: {
                sections: [
                  {
                    key: 'results',
                    title: '结果说明',
                    description: '链接可能失效，请及时下载',
                  },
                ],
              },
            },
            {
              id: '1986819253754130433',
              slug: 'exterior-transfer',
              title: '外观迁移',
              shortTitle: '外观迁移',
              description: '建筑与景观外观风格迁移。',
              chips: ['双图输入'],
              notes: ['适合外观方案'],
              nodeSummary: ['1:image', '403:image'],
              fields: [],
            },
            {
              id: '2003678561775067138',
              slug: 'floorplan-to-render',
              title: '平面转效果',
              shortTitle: '平面转效果',
              description: '基于平面图和参考图生成室内效果图。',
              chips: ['九图参考'],
              notes: ['建议一次补齐素材'],
              nodeSummary: ['2:prompt', '3:image'],
              fields: [],
            },
            {
              id: '2023563076041183233',
              slug: 'rough-to-render',
              title: '毛坯转效果',
              shortTitle: '毛坯转效果',
              description: '上传毛坯图与风格图生成改造效果。',
              chips: ['双图输入'],
              notes: ['默认 2k'],
              nodeSummary: ['541:image', '538:image'],
              fields: [],
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url === '/api/account/check') {
      return new Response(
        JSON.stringify({
          ok: true,
          maskedApiKey: 'sk-demo••••',
          balance: {
            rawBalance: '10',
            displayBalance: '15',
            displayMultiplier: 1.5,
            checkedAt: '2026-03-08T00:00:00.000Z',
          },
          account: {
            data: {
              remainCoins: '10',
              currentTaskCounts: '0',
              apiType: 'NORMAL',
            },
          },
        }),
        { status: 200 },
      );
    }

    if (url === '/api/apps/1994388299756212225/execute') {
      return new Response(
        JSON.stringify({
          ok: true,
          taskId: 'TASK-42',
          state: 'submitted',
          debug: { submitted: true },
        }),
        { status: 200 },
      );
    }

    if (url === '/api/tasks/TASK-42/status') {
      return new Response(
        JSON.stringify({
          ok: true,
          taskId: 'TASK-42',
          state: 'succeeded',
        }),
        { status: 200 },
      );
    }

    if (url === '/api/tasks/TASK-42/result') {
      return new Response(
        JSON.stringify({
          ok: true,
          taskId: 'TASK-42',
          state: 'succeeded',
          outputs: [
            {
              fileUrl: 'https://example.com/result.png',
              taskCostTime: 12,
              consumeCoins: 3,
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url.startsWith('/api/admin/auth/me')) {
      return new Response(JSON.stringify({ ok: false, message: '未登录' }), { status: 401 });
    }

    if (url.startsWith('/api/history')) {
      return new Response(JSON.stringify({ ok: true, tasks: [] }), { status: 200 });
    }

    throw new Error(`未模拟的请求：${url} ${init?.method ?? 'GET'}`);
  });
}

describe('App 白牌站点', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  test('首页展示白牌 Hero，且不再暴露真实上游文案', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    render(<App />);

    expect(await screen.findByRole('heading', { name: '控制台总览' })).toBeInTheDocument();
    expect(screen.getByText('室内设计 AI 出图平台')).toBeInTheDocument();
    expect(screen.getByText('客户资料摘要')).toBeInTheDocument();
    expect(screen.getAllByText('一键彩平').length).toBeGreaterThan(0);
    expect(screen.getAllByText('毛坯转效果').length).toBeGreaterThan(0);
    expect(screen.getByText('最近任务')).toBeInTheDocument();
    expect(screen.queryByText(/RunningHub/i)).not.toBeInTheDocument();
  });

  test('密钥中心暂时隐藏额度与倍率展示', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole('link', { name: /密钥管理/u }));
    await user.type(await screen.findByLabelText('服务密钥'), 'sk-demo-key');
    await user.click(screen.getByRole('button', { name: '校验额度' }));

    await waitFor(() => {
      expect(screen.getByText('校验反馈')).toBeInTheDocument();
      expect(screen.getByText('额度与倍率展示已暂时隐藏')).toBeInTheDocument();
      expect(screen.queryByText('15')).not.toBeInTheDocument();
      expect(screen.queryByText('倍率 ×1.5')).not.toBeInTheDocument();
    });
  });

  test('工作区可按 slug 完成应用工作台初始化', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    window.localStorage.setItem('white-label-ai.personal-api-key', 'sk-demo-key');
    window.history.pushState({}, '', '/workspace/color-plan');

    render(<App />);

    expect(screen.queryByRole('heading', { name: '应用切换' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '当前能力' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '参数配置' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '执行任务' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '任务状态' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '结果预览' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '开始生成' })).toHaveLength(1);
  });
});
