import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as adminApi from '../../features/admin/adminApi';
import { TestAppRouter } from '../../router';
import type { SiteConfig } from '../../types';

const site: SiteConfig = {
  brandName: '设计云台',
  heroTitle: '室内设计 AI 出图平台',
  heroSubtitle: '让设计工作室更快出图',
  defaultDisplayMultiplier: 1.8,
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

describe('AdminMultipliersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('应展示默认倍率并支持更新单独 API Key 倍率', async () => {
    vi.spyOn(adminApi, 'fetchAdminMe').mockResolvedValue({
      id: 1,
      username: 'admin',
      lastLoginAt: '2026-03-09T08:00:00.000Z',
    });
    vi.spyOn(adminApi, 'fetchAdminSiteConfig').mockResolvedValue(site);
    vi.spyOn(adminApi, 'listAdminMultipliers').mockResolvedValue([
      {
        id: 7,
        apiKeyHash: 'hash-demo-key',
        apiKeyMasked: 'demo****key',
        displayMultiplier: 2.2,
        lastCheckedBalance: '120',
        lastCheckedDisplayBalance: '264',
        lastCheckedAt: '2026-03-09T05:00:00.000Z',
        status: 'ready',
        createdAt: '2026-03-08T05:00:00.000Z',
        updatedAt: '2026-03-09T05:00:00.000Z',
      },
    ]);
    const updateSpy = vi.spyOn(adminApi, 'updateAdminMultiplier').mockResolvedValue({
      id: 7,
      apiKeyHash: 'hash-demo-key',
      apiKeyMasked: 'demo****key',
      displayMultiplier: 2.6,
      lastCheckedBalance: '120',
      lastCheckedDisplayBalance: '312',
      lastCheckedAt: '2026-03-09T06:00:00.000Z',
      status: 'ready',
      createdAt: '2026-03-08T05:00:00.000Z',
      updatedAt: '2026-03-09T06:00:00.000Z',
    });

    const user = userEvent.setup();

    render(
      <TestAppRouter
        initialPath="/admin/multipliers"
        publicState={{
          site,
          apps: [],
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

    expect(await screen.findByRole('heading', { name: '倍率管理' })).toBeInTheDocument();
    expect(
      await screen.findByText((_, element) => element?.textContent === '默认展示倍率 ×1.8'),
    ).toBeInTheDocument();
    expect(screen.getByText('demo****key')).toBeInTheDocument();

    const multiplierInput = screen.getByLabelText('单独倍率-demo****key');
    await user.clear(multiplierInput);
    await user.type(multiplierInput, '2.6');
    await user.click(screen.getByRole('button', { name: '保存倍率-demo****key' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(7, 2.6);
    });

    expect(await screen.findByDisplayValue('2.6')).toBeInTheDocument();
  });
});
