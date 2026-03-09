import { describe, expect, it, vi } from 'vitest';

import { checkAccount } from './accountApi';

describe('accountApi', () => {
  it('应调用后端账户检查接口', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      async json() {
        return {
          ok: true,
          maskedApiKey: 'sk-demo••••',
          balance: {
            rawBalance: '12',
            displayBalance: '18',
            displayMultiplier: 1.5,
            checkedAt: '2026-03-08T00:00:00.000Z',
          },
          account: {
            data: {
              remainCoins: '12',
              currentTaskCounts: '1',
              apiType: 'NORMAL',
            },
          },
        };
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const payload = await checkAccount('demo-key');

    expect(payload.state).toBe('ready');
    expect(payload.serviceKey).toBe('sk-demo••••');
    expect(payload.balance).toEqual({
      rawBalance: '12',
      displayBalance: '18',
      displayMultiplier: 1.5,
      checkedAt: '2026-03-08T00:00:00.000Z',
    });
    expect(payload.account).toEqual({
      remainCoins: '12',
      currentTaskCounts: '1',
      apiType: 'NORMAL',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/check',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
