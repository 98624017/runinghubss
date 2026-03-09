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

describe('AdminSitePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('应支持上传参考图并自动回填图片地址', async () => {
    vi.spyOn(adminApi, 'fetchAdminSiteConfig').mockResolvedValue(site);
    vi.spyOn(adminApi, 'uploadAdminSiteAsset').mockResolvedValue({
      fileName: 'reference-demo.png',
      url: 'http://127.0.0.1:8787/site-assets/reference-demo.png',
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

    const input = screen.getByLabelText('上传参考图 1') as HTMLInputElement;
    const file = new File(['image-demo'], 'reference-demo.png', { type: 'image/png' });
    await user.upload(input, file);

    await waitFor(() => {
      expect(adminApi.uploadAdminSiteAsset).toHaveBeenCalledTimes(1);
      expect(screen.getByDisplayValue('http://127.0.0.1:8787/site-assets/reference-demo.png')).toBeInTheDocument();
    });
  });
});
