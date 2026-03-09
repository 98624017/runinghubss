import { describe, expect, it } from 'vitest';

import { buildNodeInfoListForApp, normalizeTaskState, validateExecuteInput } from './payloadBuilders.js';

describe('payloadBuilders', () => {
  it('应构造高清放大应用的 nodeInfoList', () => {
    expect(
      buildNodeInfoListForApp({
        appId: '2011111632956563457',
        uploadedFiles: { file: 'openapi/demo.png' },
        formValues: { enable8k: true },
      }),
    ).toEqual([
      { nodeId: '308', fieldName: 'image', fieldValue: 'openapi/demo.png' },
      { nodeId: '306', fieldName: 'value', fieldValue: 'true' },
    ]);
  });

  it('应构造全能图片应用的文本节点', () => {
    expect(
      buildNodeInfoListForApp({
        appId: '1993737411698032641',
        uploadedFiles: { file: 'openapi/demo.png' },
        formValues: { prompt: '请增强细节' },
      }),
    ).toEqual([
      { nodeId: '22', fieldName: 'image', fieldValue: 'openapi/demo.png' },
      { nodeId: '43', fieldName: 'text', fieldValue: '请增强细节' },
    ]);
  });

  it('缺少文件时应报错', () => {
    expect(() =>
      validateExecuteInput({ appId: '2011111632956563457', apiKey: 'demo-key', uploadedFiles: {} }),
    ).toThrow(/缺少上传图片/u);
  });

  it('双图应用缺少任一文件时应报错', () => {
    expect(() =>
      validateExecuteInput({
        appId: '1986819253754130433',
        apiKey: 'demo-key',
        uploadedFiles: { sourceImage: 'openapi/original.png' },
      }),
    ).toThrow(/缺少上传图片/u);
  });

  it('任务不存在时应归一化为失败', () => {
    expect(
      normalizeTaskState(
        { code: 807, msg: 'APIKEY_TASK_NOT_FOUND', data: null },
        { code: 807, msg: 'APIKEY_TASK_NOT_FOUND', data: null },
      ),
    ).toBe('failed');
  });

  it('状态接口返回字符串 RUNNING 时应归一化为 running', () => {
    expect(
      normalizeTaskState(
        { code: 0, msg: 'success', data: 'RUNNING' },
        { code: 804, msg: 'APIKEY_TASK_IS_RUNNING', data: {} },
      ),
    ).toBe('running');
  });

  it('应归一化任务状态', () => {
    expect(normalizeTaskState({ data: { status: 'RUNNING' } }, { code: 804 })).toBe('running');
    expect(normalizeTaskState({ data: { status: 'RUNNING' } }, { code: 0, data: [{ fileUrl: 'x' }] })).toBe(
      'succeeded',
    );
    expect(normalizeTaskState({ data: { status: 'FAILED' } }, { code: 805 })).toBe('failed');
  });
});
