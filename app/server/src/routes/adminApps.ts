import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Pool } from 'pg';

import type { ServerEnv } from '../config/env.js';
import { badRequest } from '../errors.js';
import { createAppRepository } from '../repositories/appRepository.js';
import { createAdminSessionManager } from '../services/adminSession.js';

function readNumericParam(value: string | undefined, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${fieldName} 必须是正整数`);
  }
  return parsed;
}

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

export function createAdminAppsRouter(options: { pool: Pool; env: ServerEnv }): Router {
  const router = createRouter();
  const repository = createAppRepository(options.pool);
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
    const apps = await repository.listApps();
    return res.json({ ok: true, apps });
  });

  router.post('/', async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const app = await repository.createApp({
      slug: String(body.slug || '').trim(),
      displayName: String(body.displayName || '').trim(),
      subtitle: String(body.subtitle || '').trim(),
      description: String(body.description || '').trim(),
      coverImageUrl: body.coverImageUrl ? String(body.coverImageUrl) : null,
      tags: Array.isArray(body.tags) ? body.tags.map((item) => String(item)) : [],
      sortOrder: Number(body.sortOrder || 0),
      isEnabled: Boolean(body.isEnabled),
      usageTips: Array.isArray(body.usageTips) ? body.usageTips.map((item) => String(item)) : [],
      resultTips: Array.isArray(body.resultTips) ? body.resultTips.map((item) => String(item)) : [],
      upstreamAppId: String(body.upstreamAppId || '').trim(),
      instanceType: String(body.instanceType || 'default'),
      usePersonalQueue: Boolean(body.usePersonalQueue),
      pollIntervalMs: Number(body.pollIntervalMs || 3000),
      maxPollAttempts: Number(body.maxPollAttempts || 20),
      timeoutSeconds: Number(body.timeoutSeconds || 180),
      maxConcurrencyPerKey: Number(body.maxConcurrencyPerKey || 1),
    });

    return res.status(201).json({ ok: true, app });
  });

  router.patch('/:appId', async (req, res) => {
    const appId = readNumericParam(req.params.appId, 'appId');
    const body = req.body as Record<string, unknown>;
    const app = await repository.updateApp(appId, {
      slug: body.slug ? String(body.slug).trim() : undefined,
      displayName: body.displayName ? String(body.displayName) : undefined,
      subtitle: body.subtitle ? String(body.subtitle) : undefined,
      description: body.description ? String(body.description) : undefined,
      coverImageUrl: Object.prototype.hasOwnProperty.call(body, 'coverImageUrl')
        ? body.coverImageUrl
          ? String(body.coverImageUrl)
          : null
        : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map((item) => String(item)) : undefined,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
      usageTips: Array.isArray(body.usageTips) ? body.usageTips.map((item) => String(item)) : undefined,
      resultTips: Array.isArray(body.resultTips) ? body.resultTips.map((item) => String(item)) : undefined,
      upstreamAppId: body.upstreamAppId ? String(body.upstreamAppId) : undefined,
      instanceType: body.instanceType ? String(body.instanceType) : undefined,
      usePersonalQueue:
        typeof body.usePersonalQueue === 'boolean' ? (body.usePersonalQueue as boolean) : undefined,
      timeoutSeconds: body.timeoutSeconds as number | undefined,
      maxPollAttempts: body.maxPollAttempts as number | undefined,
      pollIntervalMs: body.pollIntervalMs as number | undefined,
      maxConcurrencyPerKey: body.maxConcurrencyPerKey as number | undefined,
      isEnabled: typeof body.isEnabled === 'boolean' ? (body.isEnabled as boolean) : undefined,
    });

    return res.json({ ok: true, app });
  });

  router.post('/:appId/schema', async (req, res) => {
    const appId = readNumericParam(req.params.appId, 'appId');
    const body = req.body as Record<string, unknown>;
    const schema = await repository.saveSchema({
      appId,
      schemaVersion: Number(body.schemaVersion || 1),
      layoutSchema: (body.layoutSchema || {}) as Record<string, unknown>,
      fieldSchema: (body.fieldSchema || {}) as Record<string, unknown>,
      resultSchema: (body.resultSchema || {}) as Record<string, unknown>,
      isPublished: Boolean(body.isPublished),
    });

    return res.json({ ok: true, schema });
  });

  return router;
}
