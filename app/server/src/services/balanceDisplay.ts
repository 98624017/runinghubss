import { createHash } from 'node:crypto';

import type { Pool } from 'pg';

import { createApiKeyArchiveRepository } from '../repositories/apiKeyArchiveRepository.js';
import { loadSiteConfig } from './branding.js';

function parseBalanceValue(rawBalance: string | null) {
  if (!rawBalance) {
    return null;
  }

  const numericValue = Number(rawBalance);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function formatBalanceValue(value: number) {
  return value.toFixed(4).replace(/\.?0+$/, '');
}

export function hashApiKey(apiKey: string) {
  return createHash('sha256').update(apiKey).digest('hex');
}

export async function buildDisplayBalanceSnapshot(options: {
  pool?: Pool;
  apiKey: string;
  maskedApiKey: string;
  rawBalance: string | null;
}) {
  const siteConfig = await loadSiteConfig(options.pool);
  const apiKeyHash = hashApiKey(options.apiKey);
  let displayMultiplier = siteConfig.defaultDisplayMultiplier;

  if (options.pool) {
    const repository = createApiKeyArchiveRepository(options.pool);
    const archive = await repository.findOrCreateArchive({
      apiKeyHash,
      apiKeyMasked: options.maskedApiKey,
    });
    if (typeof archive.displayMultiplier === 'number') {
      displayMultiplier = archive.displayMultiplier;
    }

    if (options.rawBalance) {
      const displayBalanceValue = parseBalanceValue(options.rawBalance);
      await repository.updateBalanceSnapshot({
        archiveId: archive.id,
        displayMultiplier,
        lastCheckedBalance: options.rawBalance,
        lastCheckedDisplayBalance:
          displayBalanceValue === null
            ? options.rawBalance
            : formatBalanceValue(displayBalanceValue * displayMultiplier),
        status: 'ready',
      });
    }
  }

  const rawBalanceValue = parseBalanceValue(options.rawBalance);

  return {
    apiKeyHash,
    rawBalance: options.rawBalance,
    displayBalance:
      rawBalanceValue === null ? null : formatBalanceValue(rawBalanceValue * displayMultiplier),
    displayMultiplier,
    checkedAt: new Date().toISOString(),
  };
}
