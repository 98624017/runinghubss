import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
      description: '来自客户 PDF 里的效果参考页。',
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
];

describe('HomePage', () => {
  it('应展示客户资料驱动的宣传区块', async () => {
    render(
      <TestAppRouter
        initialPath="/"
        publicState={{
          site,
          apps,
          apiKey: '',
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

    expect(await screen.findByText('客户资料摘要')).toBeInTheDocument();
    expect(screen.getByText('聚焦室内设计、软装提案与方案汇报的白牌交付场景。')).toBeInTheDocument();
    expect(screen.getByText('适用对象')).toBeInTheDocument();
    expect(screen.getByText('设计公司')).toBeInTheDocument();
    expect(screen.getByText('客户资料驱动')).toBeInTheDocument();
    expect(screen.getByText('校验额度')).toBeInTheDocument();
    expect(screen.getByText('客户参考物料')).toBeInTheDocument();
    expect(screen.getByText('系统 1 分钟后效果图')).toBeInTheDocument();
    expect(screen.queryByText('展示倍率')).not.toBeInTheDocument();
    expect(screen.queryByText('最近额度')).not.toBeInTheDocument();
    expect(screen.queryByText(/可用额度：/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '后台管理' })).not.toBeInTheDocument();
  });
});
