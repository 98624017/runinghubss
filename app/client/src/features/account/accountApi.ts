import { buildApiUrl } from '../../apiBase';
import type { AccountCheckResponse } from '../../types';

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? '请求失败');
  }
  return payload;
}

export async function checkAccount(apiKey: string): Promise<AccountCheckResponse> {
  const response = await fetch(buildApiUrl('/api/account/check'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });

  const payload = await readJson(response);
  const accountData = payload?.account?.data;
  return {
    state: payload?.ok ? 'ready' : 'error',
    serviceKey: payload?.maskedApiKey ?? undefined,
    balance: payload?.balance
      ? {
          rawBalance:
            payload.balance.rawBalance === null || payload.balance.rawBalance === undefined
              ? null
              : String(payload.balance.rawBalance),
          displayBalance:
            payload.balance.displayBalance === null || payload.balance.displayBalance === undefined
              ? null
              : String(payload.balance.displayBalance),
          displayMultiplier: Number(payload.balance.displayMultiplier ?? 1),
          checkedAt: String(payload.balance.checkedAt ?? ''),
        }
      : undefined,
    account: accountData
      ? {
          remainCoins: String(accountData.remainCoins ?? '--'),
          currentTaskCounts: String(accountData.currentTaskCounts ?? '--'),
          apiType: accountData.apiType ?? null,
        }
      : undefined,
    message: payload?.message,
    raw: payload,
  };
}
