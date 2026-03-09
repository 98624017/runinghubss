import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Pool } from 'pg';

import type { ServerEnv } from '../config/env.js';
import { createTaskRepository } from '../repositories/taskRepository.js';
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

export function createAdminTasksRouter(options: { pool: Pool; env: ServerEnv }): Router {
  const router = createRouter();
  const sessionManager = createAdminSessionManager({
    secret: options.env.sessionSecret,
    secure: options.env.nodeEnv === 'production',
  });
  const taskRepository = createTaskRepository(options.pool);

  router.use((req, res, next) => {
    if (!ensureAdminSession(req, res, sessionManager)) {
      return;
    }
    next();
  });

  router.get('/', async (req, res) => {
    const tasks = await taskRepository.listAdminTasks({
      taskNo: typeof req.query.taskNo === 'string' ? req.query.taskNo.trim() : undefined,
      upstreamTaskId:
        typeof req.query.upstreamTaskId === 'string' ? req.query.upstreamTaskId.trim() : undefined,
      apiKeyHash: typeof req.query.apiKeyHash === 'string' ? req.query.apiKeyHash.trim() : undefined,
      appSlug: typeof req.query.appSlug === 'string' ? req.query.appSlug.trim() : undefined,
      status: typeof req.query.status === 'string' ? req.query.status.trim() : undefined,
      dateFrom: typeof req.query.dateFrom === 'string' ? req.query.dateFrom.trim() : undefined,
      dateTo: typeof req.query.dateTo === 'string' ? req.query.dateTo.trim() : undefined,
    });

    return res.json({
      ok: true,
      tasks,
    });
  });

  return router;
}
