import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { Pool } from 'pg';

import { loadSiteConfig } from '../services/branding.js';

export function createSiteRouter(options: { pool?: Pool } = {}): Router {
  const router = createRouter();

  router.get('/config', async (_req, res) => {
    const site = await loadSiteConfig(options.pool);
    return res.json({
      ok: true,
      site,
    });
  });

  return router;
}
