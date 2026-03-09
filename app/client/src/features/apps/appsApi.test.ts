import { describe, expect, it, vi } from 'vitest';

import { fetchSupportedApps } from './appsApi';

describe('appsApi', () => {
  it('应调用后端动态应用清单接口', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          apps: [
            {
              id: '2011111632956563457',
              title: '动态高清应用',
              shortTitle: '动态极速放大',
              description: '从后端拉取的应用一',
              chips: ['单图输入'],
              notes: ['动态说明'],
              nodeSummary: ['308:image'],
              fields: [],
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const apps = await fetchSupportedApps();

    expect(fetchMock).toHaveBeenCalledWith('/api/apps');
    expect(apps[0]).toEqual(
      expect.objectContaining({
        id: '2011111632956563457',
        title: '动态高清应用',
      }),
    );
  });
});
