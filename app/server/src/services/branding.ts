import type { Pool } from 'pg';

import { createSystemConfigRepository } from '../repositories/systemConfigRepository.js';

export type SiteConfig = {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  defaultDisplayMultiplier: number;
  resultLinkNotice: string;
  customerSummaryTitle: string;
  customerSummaryText: string;
  targetAudienceTitle: string;
  targetAudience: string[];
  solutionHighlightsTitle: string;
  solutionHighlights: Array<{
    title: string;
    description: string;
    tag?: string;
  }>;
  workflowTitle: string;
  workflowSteps: string[];
  referenceGalleryTitle: string;
  referenceGallery: Array<{
    title: string;
    description: string;
    imageUrl: string;
    badge?: string;
  }>;
};

const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: '设计云台',
  heroTitle: '室内设计 AI 出图平台',
  heroSubtitle: '让设计工作室更快出图',
  defaultDisplayMultiplier: 1,
  resultLinkNotice: '结果链接可能失效，请及时下载',
  customerSummaryTitle: '客户资料摘要',
  customerSummaryText:
    '参考客户提供的《家具软装自动出图方案》和原始页面草图，当前宣传表达聚焦一站式全屋家具解决方案、软装提案展示与白牌交付。',  
  targetAudienceTitle: '重点场景',
  targetAudience: ['别墅 / 大平层项目', '酒店 / 办公 / 康养 / 学校家具场景', '室内设计与软装提案团队'],
  solutionHighlightsTitle: '宣传亮点',
  solutionHighlights: [
    {
      title: '一站式全屋家具方案',
      description: '沿用客户资料里的解决方案表达，适合把家具软装提案、彩平与效果输出放到同一条交付链路。',
      tag: 'Brief',
    },
    {
      title: '1 分钟效果预览',
      description: '结合客户物料中的“系统 1 分钟后效果图”表达，突出快速沟通与高频试错效率。',
      tag: 'Speed',
    },
    {
      title: '展厅实拍参考融合',
      description: '可把工厂展厅实拍、平面图和风格参考一起纳入工作台，更贴近真实软装交付场景。',
      tag: 'Scene',
    },
  ],
  workflowTitle: '客户交付流程',
  workflowSteps: ['校验服务密钥与额度', '结合客户资料选择工作台并上传素材', '在任务记录与资产区回看下载并交付'],
  referenceGalleryTitle: '客户参考物料',
  referenceGallery: [
    {
      title: '一站式全屋家具解决方案',
      description: '来自客户宣传物料封面，用于统一首页方案定位和对外表达。',
      imageUrl: '/customer-brief/page-01-cover.png',
      badge: 'Cover',
    },
    {
      title: '工厂展厅实拍参考',
      description: '客户资料里的展厅实拍，可作为软装风格、材质与陈设的参考来源。',
      imageUrl: '/customer-brief/page-03-showroom.png',
      badge: 'Scene',
    },
    {
      title: '系统 1 分钟后效果图',
      description: '客户资料里的结果页，用来强调快速生成与展示沟通效率。',
      imageUrl: '/customer-brief/page-04-ai-result.png',
      badge: 'Preview',
    },
  ],
};

function readString(value: unknown, fallbackValue: string) {
  return typeof value === 'string' && value.trim() ? value : fallbackValue;
}

function readStringArray(value: unknown, fallbackValue: string[]) {
  const items = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter((item) => item.length > 0)
    : [];
  return items.length > 0 ? items : fallbackValue;
}

function readHighlightArray(
  value: unknown,
  fallbackValue: SiteConfig['solutionHighlights'],
): SiteConfig['solutionHighlights'] {
  const items = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const title = readString((item as { title?: unknown }).title, '');
          const description = readString((item as { description?: unknown }).description, '');
          const tag = readString((item as { tag?: unknown }).tag, '').trim();

          if (!title || !description) {
            return null;
          }

          return {
            title,
            description,
            ...(tag ? { tag } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  return items.length > 0 ? items : fallbackValue;
}

function readReferenceGallery(
  value: unknown,
  fallbackValue: SiteConfig['referenceGallery'],
): SiteConfig['referenceGallery'] {
  const items = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const title = readString((item as { title?: unknown }).title, '');
          const description = readString((item as { description?: unknown }).description, '');
          const imageUrl = readString((item as { imageUrl?: unknown }).imageUrl, '');
          const badge = readString((item as { badge?: unknown }).badge, '');

          if (!title || !description || !imageUrl) {
            return null;
          }

          return {
            title,
            description,
            imageUrl,
            ...(badge ? { badge } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  return items.length > 0 ? items : fallbackValue;
}

export async function loadSiteConfig(pool?: Pool): Promise<SiteConfig> {
  if (!pool) {
    return { ...DEFAULT_SITE_CONFIG };
  }

  const repository = createSystemConfigRepository(pool);
  const brandingConfig = await repository.findConfig('site.branding');
  const defaultConfig = await repository.findConfig('site.defaults');
  const marketingConfig = await repository.findConfig('site.marketing');

  return {
    brandName: readString(brandingConfig?.configValue?.brandName, DEFAULT_SITE_CONFIG.brandName),
    heroTitle: readString(brandingConfig?.configValue?.heroTitle, DEFAULT_SITE_CONFIG.heroTitle),
    heroSubtitle: readString(
      brandingConfig?.configValue?.heroSubtitle,
      DEFAULT_SITE_CONFIG.heroSubtitle,
    ),
    defaultDisplayMultiplier:
      typeof defaultConfig?.configValue?.defaultDisplayMultiplier === 'number'
        ? defaultConfig.configValue.defaultDisplayMultiplier
        : DEFAULT_SITE_CONFIG.defaultDisplayMultiplier,
    resultLinkNotice: readString(
      defaultConfig?.configValue?.resultLinkNotice,
      DEFAULT_SITE_CONFIG.resultLinkNotice,
    ),
    customerSummaryTitle: readString(
      marketingConfig?.configValue?.customerSummaryTitle,
      DEFAULT_SITE_CONFIG.customerSummaryTitle,
    ),
    customerSummaryText: readString(
      marketingConfig?.configValue?.customerSummaryText,
      DEFAULT_SITE_CONFIG.customerSummaryText,
    ),
    targetAudienceTitle: readString(
      marketingConfig?.configValue?.targetAudienceTitle,
      DEFAULT_SITE_CONFIG.targetAudienceTitle,
    ),
    targetAudience: readStringArray(
      marketingConfig?.configValue?.targetAudience,
      DEFAULT_SITE_CONFIG.targetAudience,
    ),
    solutionHighlightsTitle: readString(
      marketingConfig?.configValue?.solutionHighlightsTitle,
      DEFAULT_SITE_CONFIG.solutionHighlightsTitle,
    ),
    solutionHighlights: readHighlightArray(
      marketingConfig?.configValue?.solutionHighlights,
      DEFAULT_SITE_CONFIG.solutionHighlights,
    ),
    workflowTitle: readString(
      marketingConfig?.configValue?.workflowTitle,
      DEFAULT_SITE_CONFIG.workflowTitle,
    ),
    workflowSteps: readStringArray(
      marketingConfig?.configValue?.workflowSteps,
      DEFAULT_SITE_CONFIG.workflowSteps,
    ),
    referenceGalleryTitle: readString(
      marketingConfig?.configValue?.referenceGalleryTitle,
      DEFAULT_SITE_CONFIG.referenceGalleryTitle,
    ),
    referenceGallery: readReferenceGallery(
      marketingConfig?.configValue?.referenceGallery,
      DEFAULT_SITE_CONFIG.referenceGallery,
    ),
  };
}

export async function saveSiteConfig(pool: Pool, site: SiteConfig): Promise<SiteConfig> {
  const repository = createSystemConfigRepository(pool);

  await repository.upsertConfig({
    key: 'site.branding',
    value: {
      brandName: site.brandName,
      heroTitle: site.heroTitle,
      heroSubtitle: site.heroSubtitle,
    },
  });

  await repository.upsertConfig({
    key: 'site.defaults',
    value: {
      defaultDisplayMultiplier: site.defaultDisplayMultiplier,
      resultLinkNotice: site.resultLinkNotice,
    },
  });

  await repository.upsertConfig({
    key: 'site.marketing',
    value: {
      customerSummaryTitle: site.customerSummaryTitle,
      customerSummaryText: site.customerSummaryText,
      targetAudienceTitle: site.targetAudienceTitle,
      targetAudience: site.targetAudience,
      solutionHighlightsTitle: site.solutionHighlightsTitle,
      solutionHighlights: site.solutionHighlights,
      workflowTitle: site.workflowTitle,
      workflowSteps: site.workflowSteps,
      referenceGalleryTitle: site.referenceGalleryTitle,
      referenceGallery: site.referenceGallery,
    },
  });

  return loadSiteConfig(pool);
}
