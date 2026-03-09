import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as historyApi from '../features/history/historyApi';
import { TestAppRouter } from '../router';
import type { AppDefinition, SiteConfig } from '../types';

const site: SiteConfig = {
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
    chips: ['彩平'],
    notes: ['结果链接可能失效，请及时下载'],
    nodeSummary: [],
  },
  {
    id: '2023563076041183233',
    slug: 'rough-to-render',
    title: '毛坯转效果',
    shortTitle: '毛坯转效果',
    description: '快速生成毛坯改造效果图。',
    chips: ['效果图'],
    notes: ['适合装修前期沟通'],
    nodeSummary: [],
  },
];

describe('AssetsPage', () => {
  it('应支持读取已完成结果并按应用筛选资产', async () => {
    const fetchHistoryMock = vi.spyOn(historyApi, 'fetchHistory').mockResolvedValue([
      {
        taskId: 'TASK-2001',
        appSlug: 'color-plan',
        displayName: '一键彩平',
        status: 'succeeded',
        submittedAt: '2026-03-08T12:00:00.000Z',
        outputUrls: ['https://example.com/asset-1.png'],
        linkExpiryReminder: '结果链接可能失效，请及时下载',
      },
    ]);

    const user = userEvent.setup();

    render(
      <TestAppRouter
        initialPath="/assets"
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

    expect((await screen.findAllByRole('heading', { name: '我的资产' })).length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: '一键彩平 资产 1' })).toHaveAttribute(
      'src',
      'https://example.com/asset-1.png',
    );
    expect(screen.getByRole('link', { name: '再次生成' })).toHaveAttribute(
      'href',
      '/workspace/color-plan',
    );

    await waitFor(() => {
      expect(fetchHistoryMock).toHaveBeenCalledWith({
        apiKey: 'demo-key',
        status: 'succeeded',
      });
    });

    fetchHistoryMock.mockClear();
    await user.selectOptions(screen.getByLabelText('应用筛选'), 'color-plan');

    await waitFor(() => {
      expect(fetchHistoryMock).toHaveBeenLastCalledWith({
        apiKey: 'demo-key',
        appSlug: 'color-plan',
        status: 'succeeded',
      });
    });
  });
});
