import cors from 'cors';
import express from 'express';
import type { Pool } from 'pg';

import type { ServerEnv } from './config/env.js';
import { isHttpError } from './errors.js';
import { createAdminAuthRouter } from './routes/adminAuth.js';
import { createAdminAppsRouter } from './routes/adminApps.js';
import { createAdminMultipliersRouter } from './routes/adminMultipliers.js';
import { createAdminSiteRouter } from './routes/adminSite.js';
import { createAccountRouter } from './routes/account.js';
import { createAdminTasksRouter } from './routes/adminTasks.js';
import { createAppsRouter } from './routes/apps.js';
import { createHistoryRouter } from './routes/history.js';
import { createSiteRouter } from './routes/site.js';
import { createTasksRouter } from './routes/tasks.js';
import { sanitizeError } from './services/sanitize.js';
import { registerSiteAssetRoutes } from './siteAssets.js';
import { registerStaticAssets, resolveStaticAssetRoot } from './static.js';
import { createTaskDispatcher } from './services/taskDispatcher.js';
import { RunningHubClient } from './services/runninghubClient.js';

type CreateAppOptions = {
  env?: ServerEnv;
  pool?: Pool;
  staticRoot?: string | null;
};

export function createApp(client: RunningHubClient = new RunningHubClient(), options: CreateAppOptions = {}) {
  const app = express();
  const staticRoot = resolveStaticAssetRoot(options.staticRoot);
  const shouldCheckStaticAssets = Boolean(options.staticRoot) || options.env?.nodeEnv === 'production';
  const taskDispatcher =
    options.env && options.pool
      ? createTaskDispatcher({
          pool: options.pool,
          client,
          sessionSecret: options.env.sessionSecret,
        })
      : undefined;
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'ai-console' });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'ai-console' });
  });

  registerSiteAssetRoutes(app);

  app.get('/ready', async (_req, res) => {
    const checks: Record<string, string> = {};
    let ready = true;

    if (options.pool) {
      try {
        await options.pool.query('select 1');
        checks.database = 'ready';
      } catch {
        ready = false;
        checks.database = 'failed';
      }
    } else {
      checks.database = 'skipped';
    }

    if (shouldCheckStaticAssets) {
      if (staticRoot) {
        checks.staticAssets = 'ready';
      } else {
        ready = false;
        checks.staticAssets = 'missing';
      }
    } else {
      checks.staticAssets = staticRoot ? 'ready' : 'skipped';
    }

    res.status(ready ? 200 : 503).json({
      ok: ready,
      ready,
      checks,
    });
  });

  app.use('/api/account', createAccountRouter(client, { pool: options.pool }));
  app.use('/api/apps', createAppsRouter(client, { pool: options.pool, taskDispatcher }));
  if (options.pool) {
    app.use('/api/history', createHistoryRouter({ pool: options.pool }));
  }
  app.use('/api/site', createSiteRouter({ pool: options.pool }));
  app.use('/api/tasks', createTasksRouter(client, { pool: options.pool, taskDispatcher }));
  if (options.env && options.pool) {
    app.use('/api/admin/auth', createAdminAuthRouter({ env: options.env, pool: options.pool }));
    app.use('/api/admin/apps', createAdminAppsRouter({ env: options.env, pool: options.pool }));
    app.use(
      '/api/admin/multipliers',
      createAdminMultipliersRouter({ env: options.env, pool: options.pool }),
    );
    app.use('/api/admin/site', createAdminSiteRouter({ env: options.env, pool: options.pool }));
    app.use('/api/admin/tasks', createAdminTasksRouter({ env: options.env, pool: options.pool }));
    // 启动后异步恢复中断任务，避免阻塞 HTTP 对外提供服务。
    void taskDispatcher?.recoverPendingTasks();
  }

  if (staticRoot) {
    registerStaticAssets(app, staticRoot);
  }

  app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const apiKey =
      String(req.body?.apiKey || '') ||
      String(req.query?.apiKey || '') ||
      String(req.header('x-runninghub-api-key') || '');
    const details = sanitizeError(error, apiKey);
    res.status(isHttpError(error) ? error.statusCode : 500).json({
      ok: false,
      message: details.message,
    });
  });

  return app;
}
