import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { Pool } from 'pg';

import { maskApiKey, sanitizePayload } from '../services/sanitize.js';
import { buildDisplayBalanceSnapshot } from '../services/balanceDisplay.js';
import type { RunningHubClient } from '../services/runninghubClient.js';

export function createAccountRouter(client: RunningHubClient, options: { pool?: Pool } = {}): Router {
  const router = createRouter();

  router.post('/check', async (req: Request, res: Response) => {
    const apiKey = String(req.body?.apiKey || '');
    if (!apiKey) {
      return res.status(400).json({ message: '缺少 apiKey' });
    }
    const payload = await client.checkAccount(apiKey);
    const maskedApiKey = maskApiKey(apiKey);
    const balance = await buildDisplayBalanceSnapshot({
      pool: options.pool,
      apiKey,
      maskedApiKey,
      rawBalance:
        payload?.data?.remainCoins === undefined || payload?.data?.remainCoins === null
          ? null
          : String(payload.data.remainCoins),
    });

    return res.json({
      ok: true,
      maskedApiKey,
      account: sanitizePayload(payload, apiKey),
      balance,
      displayBalance: balance.displayBalance,
      displayMultiplier: balance.displayMultiplier,
    });
  });

  return router;
}
