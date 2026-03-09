import { describe, expect, it, vi } from 'vitest';

import { fetchHistory } from './historyApi';

describe('historyApi', () => {
  it('应携带筛选参数读取历史记录并完成字段映射', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          ok: true,
          tasks: [
            {
              taskId: 'TASK-1001',
              appSlug: 'color-plan',
              displayName: '一键彩平',
              status: 'succeeded',
              submittedAt: '2026-03-08T10:00:00.000Z',
              outputUrls: ['https://example.com/result.png'],
              linkExpiryReminder: '结果链接可能失效，请及时下载',
            },
          ],
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const tasks = await fetchHistory({
      apiKey: 'demo-key',
      appSlug: 'color-plan',
      status: 'succeeded',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/history?apiKey=demo-key&appSlug=color-plan&status=succeeded',
    );
    expect(tasks).toEqual([
      {
        taskId: 'TASK-1001',
        appSlug: 'color-plan',
        displayName: '一键彩平',
        status: 'succeeded',
        submittedAt: '2026-03-08T10:00:00.000Z',
        outputUrls: ['https://example.com/result.png'],
        linkExpiryReminder: '结果链接可能失效，请及时下载',
      },
    ]);
  });
});
