import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Pool } from 'pg';

import { createAppRepository } from '../repositories/appRepository.js';
import { createTaskRepository } from '../repositories/taskRepository.js';
import { hashApiKey } from '../services/balanceDisplay.js';

export function createHistoryRouter(options: { pool: Pool }): Router {
  const router = createRouter();
  const taskRepository = createTaskRepository(options.pool);
  const appRepository = createAppRepository(options.pool);

  router.get('/', async (req: Request, res: Response) => {
    const apiKey = String(req.query.apiKey || '').trim();
    if (!apiKey) {
      return res.status(400).json({ message: '缺少 apiKey' });
    }

    const tasks = await taskRepository.listHistoryByApiKeyHash({
      apiKeyHash: hashApiKey(apiKey),
      appSlug: typeof req.query.appSlug === 'string' ? req.query.appSlug : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    });

    const items = await Promise.all(
      tasks.map(async (task) => {
        const app = await appRepository.findAppById(task.appId);
        return {
          taskId: task.taskNo,
          appSlug: task.appSlug,
          displayName: task.displayName,
          status: task.status,
          submittedAt: task.submittedAt,
          outputUrls: task.resultSnapshot?.outputUrls ?? [],
          linkExpiryReminder: app?.resultTips?.[0] || '结果链接可能失效，请及时下载',
        };
      }),
    );

    return res.json({
      ok: true,
      tasks: items,
    });
  });

  return router;
}
