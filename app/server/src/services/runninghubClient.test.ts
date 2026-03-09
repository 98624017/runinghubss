import { describe, expect, it, vi } from 'vitest';

import { RunningHubClient, sanitizeRunningHubDebug } from './runninghubClient.js';
import { maskApiKey } from './sanitize.js';

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify(payload);
    },
  } as Response;
}

describe('RunningHubClient', () => {
  it('应正确请求账户检查接口', async () => {
    const fetchImpl = vi.fn(async () => createJsonResponse({ code: 0 }));
    const client = new RunningHubClient({ fetchImpl: fetchImpl as typeof fetch });

    await client.checkAccount('demo-key');

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe('https://www.runninghub.cn/uc/openapi/accountStatus');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ apikey: 'demo-key' });
  });

  it('应上传文件并发送 formData', async () => {
    const fetchImpl = vi.fn(async () => createJsonResponse({ code: 0 }));
    const client = new RunningHubClient({ fetchImpl: fetchImpl as typeof fetch });

    await client.uploadFile('demo-key', {
      buffer: Buffer.from('hello'),
      filename: 'demo.png',
      mimeType: 'image/png',
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe('https://www.runninghub.cn/openapi/v2/media/upload/binary');
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
  });

  it('应提交 AI 应用任务', async () => {
    const fetchImpl = vi.fn(async () => createJsonResponse({ code: 0 }));
    const client = new RunningHubClient({ fetchImpl: fetchImpl as typeof fetch });

    await client.runAiApp('demo-key', {
      webappId: '123',
      nodeInfoList: [{ nodeId: '1', fieldName: 'image', fieldValue: 'openapi/demo.png' }],
    });

    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      webappId: '123',
      apiKey: 'demo-key',
      nodeInfoList: [{ nodeId: '1', fieldName: 'image', fieldValue: 'openapi/demo.png' }],
    });
  });

  it('应查询状态与结果', async () => {
    const fetchImpl = vi
      .fn(async () => createJsonResponse({ code: 0 }))
      .mockImplementationOnce(async () => createJsonResponse({ code: 0 }))
      .mockImplementationOnce(async () => createJsonResponse({ code: 804 }));
    const client = new RunningHubClient({ fetchImpl: fetchImpl as typeof fetch });

    await client.queryStatus('demo-key', '42');
    await client.queryOutputs('demo-key', '42');

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const firstCall = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
    const secondCall = JSON.parse(String(fetchImpl.mock.calls[1][1].body));
    expect(firstCall).toEqual({ taskId: '42', apiKey: 'demo-key' });
    expect(secondCall).toEqual({ taskId: '42', apiKey: 'demo-key' });
  });

  it('账户接口返回业务错误码时应抛错', async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({ code: 1601, msg: 'param apiKey is required' }),
    );
    const client = new RunningHubClient({ fetchImpl: fetchImpl as typeof fetch });

    await expect(client.checkAccount('demo-key')).rejects.toThrow(/1601/u);
  });

  it('任务发起失败时错误消息不能泄露明文 apiKey', async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({ code: 433, msg: 'Your API balance is insufficient: demo-key' }),
    );
    const client = new RunningHubClient({ fetchImpl: fetchImpl as typeof fetch });

    await expect(
      client.runAiApp('demo-key', {
        webappId: '123',
        nodeInfoList: [{ nodeId: '1', fieldName: 'image', fieldValue: 'openapi/demo.png' }],
      }),
    ).rejects.toThrow(/<SERVICE_API_KEY>/u);
  });

  it('应对调试数据做脱敏', () => {
    const sanitized = sanitizeRunningHubDebug(
      { apiKey: 'demo-key', nested: { message: 'hello demo-key' } },
      'demo-key',
    );
    expect(sanitized).toEqual({
      apiKey: '<SERVICE_API_KEY>',
      nested: { message: 'hello <SERVICE_API_KEY>' },
    });
    expect(maskApiKey('1234567890abcdef')).toContain('*');
  });
});
