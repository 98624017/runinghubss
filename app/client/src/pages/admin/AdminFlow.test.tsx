import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as adminApi from '../../features/admin/adminApi';
import { TestAppRouter } from '../../router';
import type { AppDefinition, SiteConfig } from '../../types';

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

const apps: AppDefinition[] = [];

describe('Admin 后台流程', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('应支持登录并保存应用配置', async () => {
    vi.spyOn(adminApi, 'loginAdmin').mockResolvedValue({
      id: 1,
      username: 'admin',
      lastLoginAt: '2026-03-08T10:00:00.000Z',
    });
    vi.spyOn(adminApi, 'fetchAdminMe')
      .mockRejectedValueOnce(new Error('未登录'))
      .mockResolvedValue({
        id: 1,
        username: 'admin',
        lastLoginAt: '2026-03-08T10:00:00.000Z',
      });
    vi.spyOn(adminApi, 'fetchAdminApps').mockResolvedValue([
      {
        id: 9,
        slug: 'floorplan-color',
        displayName: '一键彩平',
        subtitle: '快速生成彩平图',
        description: '将平面白图转换为彩平效果图。',
        coverImageUrl: null,
        tags: ['彩平'],
        sortOrder: 10,
        isEnabled: true,
        usageTips: ['建议上传清晰平面图'],
        resultTips: ['结果链接可能失效，请及时下载'],
        upstreamAppId: '1994388299756212225',
        instanceType: 'default',
        usePersonalQueue: false,
        pollIntervalMs: 5000,
        maxPollAttempts: 60,
        timeoutSeconds: 900,
        maxConcurrencyPerKey: 2,
        publishedSchema: {
          id: 11,
          appId: 9,
          schemaVersion: 3,
          layoutSchema: { sections: [{ key: 'inputs', title: '素材上传' }] },
          fieldSchema: {
            fields: [
              {
                key: 'file',
                label: '上传平面图',
                type: 'file',
                description: '上传素材',
                required: true,
                sectionKey: 'inputs',
              },
            ],
          },
          resultSchema: { sections: [{ key: 'results', title: '结果说明' }] },
          isPublished: true,
        },
      },
    ]);
    vi.spyOn(adminApi, 'updateAdminApp').mockResolvedValue({
      id: 9,
      slug: 'floorplan-color',
      displayName: '一键彩平 Pro',
      subtitle: '快速生成彩平图',
      description: '将平面白图转换为彩平效果图。',
      coverImageUrl: null,
      tags: ['彩平'],
      sortOrder: 10,
      isEnabled: true,
      usageTips: ['建议上传清晰平面图'],
      resultTips: ['结果链接可能失效，请及时下载'],
      upstreamAppId: '1994388299756212225',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 5000,
      maxPollAttempts: 60,
      timeoutSeconds: 1200,
      maxConcurrencyPerKey: 2,
    });
    vi.spyOn(adminApi, 'publishAdminSchema').mockResolvedValue({
      id: 12,
      appId: 9,
      schemaVersion: 4,
      timeoutSeconds: 1200,
      layoutSchema: { sections: [{ key: 'inputs', title: '素材上传' }] },
      fieldSchema: { fields: [] },
      resultSchema: { sections: [{ key: 'results', title: '结果说明' }] },
      isPublished: true,
    });

    const user = userEvent.setup();

    render(
      <TestAppRouter
        initialPath="/admin/login"
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

    await user.clear(screen.getByLabelText('用户名'));
    await user.type(screen.getByLabelText('用户名'), 'admin');
    await user.type(screen.getByLabelText('密码'), 'change-me');
    await user.click(screen.getByRole('button', { name: '登录后台' }));

    expect(await screen.findByRole('heading', { name: '应用管理' })).toBeInTheDocument();

    const nameInput = await screen.findByLabelText('前台显示名称');
    await user.clear(nameInput);
    await user.type(nameInput, '一键彩平 Pro');
    const timeoutInput = await screen.findByLabelText('总体超时时间（秒）');
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '1200');
    await user.click(screen.getByRole('button', { name: '保存应用' }));

    await waitFor(() => {
      expect(adminApi.updateAdminApp).toHaveBeenCalledWith(
        9,
        expect.objectContaining({
          displayName: '一键彩平 Pro',
          timeoutSeconds: 1200,
        }),
      );
    }, { timeout: 3000 });

    await user.click(screen.getByRole('button', { name: '发布 schema' }));

    await waitFor(() => {
      expect(adminApi.publishAdminSchema).toHaveBeenCalledWith(
        9,
        expect.objectContaining({
          timeoutSeconds: 1200,
        }),
      );
    }, { timeout: 3000 });
  });
});
