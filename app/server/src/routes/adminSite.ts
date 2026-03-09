import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import multer from 'multer';
import type { Pool } from 'pg';

import type { ServerEnv } from '../config/env.js';
import { createAdminSessionManager } from '../services/adminSession.js';
import { loadSiteConfig, saveSiteConfig } from '../services/branding.js';
import { buildSiteAssetUrl, saveSiteAsset } from '../siteAssets.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function ensureAdminSession(
  request: Request,
  response: Response,
  sessionManager: ReturnType<typeof createAdminSessionManager>,
) {
  const session = sessionManager.read(request);
  if (!session) {
    response.status(401).json({ ok: false, message: '未登录' });
    return null;
  }
  return session;
}

export function createAdminSiteRouter(options: { pool: Pool; env: ServerEnv }): Router {
  const router = createRouter();
  const sessionManager = createAdminSessionManager({
    secret: options.env.sessionSecret,
    secure: options.env.nodeEnv === 'production',
  });

  router.use((req, res, next) => {
    if (!ensureAdminSession(req, res, sessionManager)) {
      return;
    }
    next();
  });

  router.get('/', async (_req, res) => {
    const site = await loadSiteConfig(options.pool);
    return res.json({ ok: true, site });
  });

  router.post('/assets', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ ok: false, message: '请先选择要上传的图片' });
    }

    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ ok: false, message: '仅支持上传图片文件' });
    }

    // 统一把站点参考图落到服务端静态目录，方便后台回填可访问地址。
    const asset = saveSiteAsset(file);

    return res.json({
      ok: true,
      asset: {
        fileName: asset.fileName,
        url: buildSiteAssetUrl(req, asset.publicPath),
      },
    });
  });

  router.patch('/', async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const currentSite = await loadSiteConfig(options.pool);

    const site = await saveSiteConfig(options.pool, {
      brandName: typeof body.brandName === 'string' ? body.brandName.trim() : currentSite.brandName,
      heroTitle: typeof body.heroTitle === 'string' ? body.heroTitle.trim() : currentSite.heroTitle,
      heroSubtitle:
        typeof body.heroSubtitle === 'string' ? body.heroSubtitle.trim() : currentSite.heroSubtitle,
      defaultDisplayMultiplier:
        typeof body.defaultDisplayMultiplier === 'number'
          ? body.defaultDisplayMultiplier
          : currentSite.defaultDisplayMultiplier,
      resultLinkNotice:
        typeof body.resultLinkNotice === 'string'
          ? body.resultLinkNotice.trim()
          : currentSite.resultLinkNotice,
      customerSummaryTitle:
        typeof body.customerSummaryTitle === 'string'
          ? body.customerSummaryTitle.trim()
          : currentSite.customerSummaryTitle,
      customerSummaryText:
        typeof body.customerSummaryText === 'string'
          ? body.customerSummaryText.trim()
          : currentSite.customerSummaryText,
      targetAudienceTitle:
        typeof body.targetAudienceTitle === 'string'
          ? body.targetAudienceTitle.trim()
          : currentSite.targetAudienceTitle,
      targetAudience: Array.isArray(body.targetAudience)
        ? body.targetAudience.map((item) => String(item).trim()).filter((item) => item.length > 0)
        : currentSite.targetAudience,
      solutionHighlightsTitle:
        typeof body.solutionHighlightsTitle === 'string'
          ? body.solutionHighlightsTitle.trim()
          : currentSite.solutionHighlightsTitle,
      solutionHighlights: Array.isArray(body.solutionHighlights)
        ? body.solutionHighlights
            .map((item) => {
              if (!item || typeof item !== 'object') {
                return null;
              }

              const title = typeof (item as { title?: unknown }).title === 'string'
                ? (item as { title: string }).title.trim()
                : '';
              const description = typeof (item as { description?: unknown }).description === 'string'
                ? (item as { description: string }).description.trim()
                : '';
              const tag = typeof (item as { tag?: unknown }).tag === 'string'
                ? (item as { tag: string }).tag.trim()
                : '';

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
        : currentSite.solutionHighlights,
      workflowTitle:
        typeof body.workflowTitle === 'string'
          ? body.workflowTitle.trim()
          : currentSite.workflowTitle,
      workflowSteps: Array.isArray(body.workflowSteps)
        ? body.workflowSteps.map((item) => String(item).trim()).filter((item) => item.length > 0)
        : currentSite.workflowSteps,
      referenceGalleryTitle:
        typeof body.referenceGalleryTitle === 'string'
          ? body.referenceGalleryTitle.trim()
          : currentSite.referenceGalleryTitle,
      referenceGallery: Array.isArray(body.referenceGallery)
        ? body.referenceGallery
            .map((item) => {
              if (!item || typeof item !== 'object') {
                return null;
              }

              const title =
                typeof (item as { title?: unknown }).title === 'string'
                  ? (item as { title: string }).title.trim()
                  : '';
              const description =
                typeof (item as { description?: unknown }).description === 'string'
                  ? (item as { description: string }).description.trim()
                  : '';
              const imageUrl =
                typeof (item as { imageUrl?: unknown }).imageUrl === 'string'
                  ? (item as { imageUrl: string }).imageUrl.trim()
                  : '';
              const badge =
                typeof (item as { badge?: unknown }).badge === 'string'
                  ? (item as { badge: string }).badge.trim()
                  : '';

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
        : currentSite.referenceGallery,
    });

    return res.json({ ok: true, site });
  });

  return router;
}
