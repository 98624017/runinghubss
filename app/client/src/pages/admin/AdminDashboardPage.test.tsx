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

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('应支持读取并保存站点内容配置', async () => {
    vi.spyOn(adminApi, 'fetchAdminMe').mockResolvedValue({
      id: 1,
      username: 'admin',
      lastLoginAt: '2026-03-09T00:00:00.000Z',
    });
    vi.spyOn(adminApi, 'fetchAdminApps').mockResolvedValue([]);
    vi.spyOn(adminApi, 'fetchAdminTasks').mockResolvedValue([]);
    vi.spyOn(adminApi, 'fetchAdminSiteConfig').mockResolvedValue(site);
    vi.spyOn(adminApi, 'updateAdminSiteConfig').mockResolvedValue({
      ...site,
      brandName: '空间设计云台',
      heroTitle: '面向室内设计团队的 AI 出图平台',
      targetAudience: ['设计公司', '软装团队', '独立设计师'],
    });

    const user = userEvent.setup();

    render(
      <TestAppRouter
        initialPath="/admin/site"
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

    expect(await screen.findByRole('heading', { name: '站点内容' })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('品牌名称'));
    await user.type(screen.getByLabelText('品牌名称'), '空间设计云台');
    await user.clear(screen.getByLabelText('首页主标题'));
    await user.type(screen.getByLabelText('首页主标题'), '面向室内设计团队的 AI 出图平台');
    await user.clear(screen.getByLabelText('适用对象'));
    await user.type(screen.getByLabelText('适用对象'), '设计公司\n软装团队\n独立设计师');
    await user.click(screen.getByRole('button', { name: '保存站点内容' }));

    await waitFor(() => {
      expect(adminApi.updateAdminSiteConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          brandName: '空间设计云台',
          heroTitle: '面向室内设计团队的 AI 出图平台',
          targetAudience: ['设计公司', '软装团队', '独立设计师'],
        }),
      );
    });
  });
});
