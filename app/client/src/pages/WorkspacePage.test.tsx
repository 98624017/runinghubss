import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as taskApi from '../features/tasks/taskApi';
import { TestAppRouter } from '../router';
import type { AppDefinition, SiteConfig } from '../types';

const site: SiteConfig = {
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
  referenceGalleryTitle: '客户参考物料',
  referenceGallery: [
    {
      title: '系统 1 分钟后效果图',
      description: '用于首页展示客户资料里的效果参考。',
      imageUrl: '/customer-brief/page-04-ai-result.png',
      badge: 'Preview',
    },
  ],
};

const apps: AppDefinition[] = [
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
        accept: 'image/*',
        group: '上传素材',
      },
      {
        key: 'prompt',
        label: '风格提示',
        type: 'text',
        description: '补充空间风格与材质要求',
        required: true,
        defaultValue: '现代暖木风格',
        presets: ['现代暖木风格'],
        group: '创作参数',
        multiline: true,
      },
    ],
  },
];

describe('WorkspacePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('应按 slug 加载工作区并完成任务提交', async () => {
    vi.spyOn(taskApi, 'executeApp').mockResolvedValue({
      taskId: 'TASK-1001',
      state: 'queued',
      debug: { submit: true },
    });
    vi.spyOn(taskApi, 'fetchTaskStatus').mockResolvedValue({
      taskId: 'TASK-1001',
      state: 'SUCCESS',
      raw: { status: true },
    });
    vi.spyOn(taskApi, 'fetchTaskResult').mockResolvedValue({
      taskId: 'TASK-1001',
      state: 'SUCCESS',
      outputs: [{ fileUrl: 'https://example.com/result.png', taskCostTime: 18, consumeCoins: 2 }],
      raw: { result: true },
    });

    const user = userEvent.setup();

    render(
      <TestAppRouter
        initialPath="/workspace/color-plan"
        publicState={{
          site,
          apps,
          apiKey: 'demo-key',
          account: null,
          accountError: null,
          isCheckingAccount: false,
        }}
        publicActions={{
          onApiKeyChange: () => undefined,
          onCheckAccount: async () => undefined,
          onClearApiKey: () => undefined,
        }}
      />,
    );

    expect(screen.queryByRole('heading', { name: '应用切换' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '当前能力' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '参数配置' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '执行任务' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '任务状态' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '结果预览' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '开始生成' })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: '后台管理' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('风格提示')).toHaveValue('现代暖木风格');

    const file = new File(['demo'], 'plan.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('上传平面图'), file);

    await user.click(screen.getByRole('button', { name: '开始生成' }));

    await waitFor(() => {
      expect(taskApi.executeApp).toHaveBeenCalledWith(
        '1994388299756212225',
        expect.objectContaining({
          apiKey: 'demo-key',
          formValues: expect.objectContaining({
            prompt: '现代暖木风格',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('TASK-1001')).toBeInTheDocument();
      expect(screen.getByText('结果链接可能失效，请及时下载')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '下载结果' })).toHaveAttribute(
        'href',
        'https://example.com/result.png',
      );
      const taskLinks = screen.getAllByRole('link', { name: '任务记录' });
      expect(taskLinks.some((link) => link.getAttribute('href') === '/tasks?appSlug=color-plan')).toBe(true);
      expect(screen.getByRole('link', { name: '再次生成' })).toHaveAttribute(
        'href',
        '/workspace/color-plan',
      );
    }, { timeout: 3000 });
  });
});
