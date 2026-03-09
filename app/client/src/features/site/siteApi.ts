import { fetchSupportedApps } from '../apps/appsApi';
import { APPS } from '../apps/appsConfig';
import type { SiteConfig } from '../../types';
import { buildApiUrl } from '../../apiBase';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
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
  workflowSteps: ['校验服务密钥', '结合客户资料选择工作台并上传素材', '在任务记录与资产区回看下载并交付'],
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
          const tag = readString((item as { tag?: unknown }).tag, '');
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

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? '请求失败');
  }
  return payload;
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  const response = await fetch(buildApiUrl('/api/site/config'));
  const payload = await readJson(response);
  const site = payload?.site;

  return {
    brandName: readString(site?.brandName, DEFAULT_SITE_CONFIG.brandName),
    heroTitle: readString(site?.heroTitle, DEFAULT_SITE_CONFIG.heroTitle),
    heroSubtitle: readString(site?.heroSubtitle, DEFAULT_SITE_CONFIG.heroSubtitle),
    defaultDisplayMultiplier: Number(
      site?.defaultDisplayMultiplier ?? DEFAULT_SITE_CONFIG.defaultDisplayMultiplier,
    ),
    resultLinkNotice: readString(site?.resultLinkNotice, DEFAULT_SITE_CONFIG.resultLinkNotice),
    customerSummaryTitle: readString(
      site?.customerSummaryTitle,
      DEFAULT_SITE_CONFIG.customerSummaryTitle,
    ),
    customerSummaryText: readString(
      site?.customerSummaryText,
      DEFAULT_SITE_CONFIG.customerSummaryText,
    ),
    targetAudienceTitle: readString(
      site?.targetAudienceTitle,
      DEFAULT_SITE_CONFIG.targetAudienceTitle,
    ),
    targetAudience: readStringArray(site?.targetAudience, DEFAULT_SITE_CONFIG.targetAudience),
    solutionHighlightsTitle: readString(
      site?.solutionHighlightsTitle,
      DEFAULT_SITE_CONFIG.solutionHighlightsTitle,
    ),
    solutionHighlights: readHighlightArray(
      site?.solutionHighlights,
      DEFAULT_SITE_CONFIG.solutionHighlights,
    ),
    workflowTitle: readString(site?.workflowTitle, DEFAULT_SITE_CONFIG.workflowTitle),
    workflowSteps: readStringArray(site?.workflowSteps, DEFAULT_SITE_CONFIG.workflowSteps),
    referenceGalleryTitle: readString(
      site?.referenceGalleryTitle,
      DEFAULT_SITE_CONFIG.referenceGalleryTitle,
    ),
    referenceGallery: readReferenceGallery(
      site?.referenceGallery,
      DEFAULT_SITE_CONFIG.referenceGallery,
    ),
  };
}

export async function loadSiteBootstrap() {
  const [site, apps] = await Promise.all([fetchSiteConfig(), fetchSupportedApps()]);
  return {
    site,
    apps: apps.length > 0 ? apps : APPS,
  };
}

export const fetchPublicBootstrap = loadSiteBootstrap;
