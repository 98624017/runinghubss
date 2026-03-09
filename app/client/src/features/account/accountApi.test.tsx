import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { AccountPanel } from './AccountPanel';
import { checkAccount } from './accountApi';

describe('account feature', () => {
  test('账户检查接口发起请求', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          maskedApiKey: 'sk-demo••••',
          balance: {
            rawBalance: '10',
            displayBalance: '15',
            displayMultiplier: 1.5,
            checkedAt: '2026-03-08T00:00:00.000Z',
          },
          account: {
            data: {
              remainCoins: '10',
              currentTaskCounts: '0',
              apiType: 'NORMAL',
            },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await checkAccount('demo-key');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/check',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  test('账户面板可输入 api key 并触发检查', async () => {
    const onCheckAccount = vi.fn(async () => undefined);
    const onApiKeyChange = vi.fn();
    render(
      <AccountPanel
        apiKey="demo-key"
        onApiKeyChange={onApiKeyChange}
        onCheck={onCheckAccount}
        isChecking={false}
        account={null}
        errorMessage={null}
      />,
    );

    await userEvent.clear(screen.getByLabelText('服务密钥'));
    await userEvent.type(screen.getByLabelText('服务密钥'), 'demo-key-next');
    await userEvent.click(screen.getByRole('button', { name: '校验额度' }));

    await waitFor(() => {
      expect(onApiKeyChange).toHaveBeenCalled();
      expect(onCheckAccount).toHaveBeenCalled();
    });
  });
});
