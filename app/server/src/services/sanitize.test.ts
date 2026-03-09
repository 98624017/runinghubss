import { describe, expect, it } from 'vitest';

import { sanitizeError, sanitizePublicMessage, sanitizePayload } from './sanitize.js';

describe('sanitize service', () => {
  it('应将公开错误消息中的上游品牌词和密钥头替换为白牌文案', () => {
    expect(
      sanitizePublicMessage(
        'RunningHub HTTP 失败：502，缺少 x-runninghub-api-key，详情见 www.runninghub.cn',
        'demo-key',
      ),
    ).toBe('上游服务 HTTP 失败：502，缺少服务密钥，详情见 上游服务');
  });

  it('应在错误消息中隐藏明文服务密钥', () => {
    expect(
      sanitizeError(new Error('RunningHub 业务失败：demo-key 余额不足'), 'demo-key'),
    ).toEqual({
      message: '上游服务 业务失败：<SERVICE_API_KEY> 余额不足',
    });
  });

  it('应继续对调试载荷做密钥脱敏', () => {
    expect(
      sanitizePayload(
        { apiKey: 'demo-key', nested: { message: 'hello demo-key' } },
        'demo-key',
      ),
    ).toEqual({
      apiKey: '<SERVICE_API_KEY>',
      nested: { message: 'hello <SERVICE_API_KEY>' },
    });
  });
});
