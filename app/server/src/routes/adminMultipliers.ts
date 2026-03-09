import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Pool } from 'pg';

import type { ServerEnv } from '../config/env.js';
import { createApiKeyArchiveRepository } from '../repositories/apiKeyArchiveRepository.js';
import { createAdminSessionManager } from '../services/adminSession.js';

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

export function createAdminMultipliersRouter(options: { pool: Pool; env: ServerEnv }): Router {
  const router = createRouter();
  const sessionManager = createAdminSessionManager({
    secret: options.env.sessionSecret,
    secure: options.env.nodeEnv === 'production',
  });
  const archiveRepository = createApiKeyArchiveRepository(options.pool);

  router.use((req, res, next) => {
    if (!ensureAdminSession(req, res, sessionManager)) {
      return;
    }
    next();
  });

  router.get('/', async (_req, res) => {
    const archives = await archiveRepository.listArchives();

    return res.json({
      ok: true,
      archives,
    });
  });

  router.patch('/:archiveId', async (req, res) => {
    const archiveId = Number(req.params.archiveId);
    const rawDisplayMultiplier = req.body?.displayMultiplier;
    const displayMultiplier = Number(rawDisplayMultiplier);

    if (!Number.isInteger(archiveId) || archiveId <= 0) {
      return res.status(400).json({ ok: false, message: 'archiveId 非法' });
    }

    if (!Number.isFinite(displayMultiplier) || displayMultiplier <= 0) {
      return res.status(400).json({ ok: false, message: 'displayMultiplier 必须大于 0' });
    }

    // 单独倍率只更新覆盖值，不重写最近一次余额快照。
    const archive = await archiveRepository.updateDisplayMultiplier({
      archiveId,
      displayMultiplier,
    });

    if (!archive) {
      return res.status(404).json({ ok: false, message: '未找到对应 API Key 归档' });
    }

    return res.json({
      ok: true,
      archive,
    });
  });

  return router;
}
