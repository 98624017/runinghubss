import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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

describe('后台管理页面', () => {
  it('应支持后台登录并保存应用', async () => {
    vi.spyOn(adminApi, 'loginAdmin').mockResolvedValue({
      id: 1,
      username: 'admin',
      lastLoginAt: null,
    });
    vi.spyOn(adminApi, 'fetchAdminMe')
      .mockRejectedValueOnce(new Error('未登录'))
      .mockResolvedValue({
        id: 1,
        username: 'admin',
        lastLoginAt: null,
      });
    vi.spyOn(adminApi, 'fetchAdminApps').mockResolvedValue([]);
    vi.spyOn(adminApi, 'createAdminApp').mockResolvedValue({
      id: 2,
      slug: 'new-app',
      displayName: '新应用',
      subtitle: '快速测试',
      description: '测试描述',
      coverImageUrl: null,
      tags: [],
      sortOrder: 1,
      isEnabled: true,
      usageTips: [],
      resultTips: [],
      upstreamAppId: '2000000000000000001',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 3000,
      maxPollAttempts: 20,
      timeoutSeconds: 180,
      maxConcurrencyPerKey: 1,
      publishedSchema: null,
    });
    vi.spyOn(adminApi, 'saveAppSchema').mockResolvedValue({
      id: 11,
      appId: 2,
      schemaVersion: 1,
      layoutSchema: { sections: [] },
      fieldSchema: { fields: [] },
      resultSchema: { sections: [] },
      isPublished: true,
      timeoutSeconds: 180,
    });
    vi.spyOn(adminApi, 'publishAdminSchema').mockResolvedValue({
      id: 11,
      appId: 2,
      schemaVersion: 1,
      layoutSchema: { sections: [] },
      fieldSchema: { fields: [] },
      resultSchema: { sections: [] },
      isPublished: true,
      timeoutSeconds: 180,
    });

    const user = userEvent.setup();

    render(
      <TestAppRouter
        initialPath="/admin/login"
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

    await user.clear(await screen.findByLabelText('用户名'));
    await user.type(await screen.findByLabelText('用户名'), 'admin');
    await user.type(screen.getByLabelText('密码'), 'change-me');
    await user.click(screen.getByRole('button', { name: '登录后台' }));

    expect(await screen.findByRole('heading', { name: '应用管理' })).toBeInTheDocument();

    await user.type(await screen.findByLabelText('应用标识'), 'new-app');
    await user.type(await screen.findByLabelText('前台显示名称'), '新应用');
    await user.type(await screen.findByLabelText('副标题'), '快速测试');
    await user.type(await screen.findByLabelText('应用描述'), '测试描述');
    await user.type(await screen.findByLabelText('上游 App ID'), '2000000000000000001');
    await user.click(screen.getByRole('button', { name: '保存应用' }));

    await waitFor(() => {
      expect(adminApi.createAdminApp).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'new-app',
          displayName: '新应用',
          timeoutSeconds: 180,
        }),
      );
    });
    await waitFor(() => {
      expect(adminApi.saveAppSchema).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          timeoutSeconds: 180,
        }),
      );
    });
    expect(await screen.findByText('当前选中：新应用')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '发布 schema' }));

    await waitFor(() => {
      expect(adminApi.publishAdminSchema).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          timeoutSeconds: 180,
        }),
      );
    });
  });
});
