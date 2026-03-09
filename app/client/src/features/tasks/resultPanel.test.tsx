import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResultPanel } from './ResultPanel';

describe('ResultPanel', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(async () => undefined),
      },
    });
  });

  it('应提供下载结果与复制链接动作', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ResultPanel
          result={{
            taskId: '42',
            state: 'SUCCESS',
            outputs: [
              {
                fileUrl: 'https://example.com/result.png',
                taskCostTime: 12,
                consumeCoins: 3,
              },
            ],
          }}
          notice="结果链接可能失效，请及时下载"
          historyHref="/tasks?appSlug=color-plan"
          rerunHref="/workspace/color-plan"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '下载结果' })).toHaveAttribute(
      'href',
      'https://example.com/result.png',
    );
    expect(screen.getByRole('link', { name: '下载结果' })).toHaveAttribute('download');

    await user.click(screen.getByRole('button', { name: '复制链接' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '已复制' })).toBeInTheDocument();
    });

    expect(screen.getByText('结果链接可能失效，请及时下载')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '任务记录' })).toHaveAttribute(
      'href',
      '/tasks?appSlug=color-plan',
    );
    expect(screen.getByRole('link', { name: '再次生成' })).toHaveAttribute(
      'href',
      '/workspace/color-plan',
    );
  });
});
