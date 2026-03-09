import { describe, expect, it } from 'vitest';

import type { AppDefinition } from '../../types';
import { createInitialFormValues, hasRequiredFieldsReady } from './formState';

const demoApp: AppDefinition = {
  id: '1993737411698032641',
  slug: 'dynamic-demo',
  title: '动态应用',
  shortTitle: '动态应用',
  description: 'demo',
  chips: [],
  notes: [],
  nodeSummary: [],
  fields: [
    {
      key: 'file',
      label: '主图',
      type: 'file',
      description: '上传主图',
      required: true,
      accept: 'image/*',
    },
    {
      key: 'enable8k',
      label: '开启 8K',
      type: 'boolean',
      description: '布尔开关',
      required: false,
      defaultValue: true,
    },
    {
      key: 'prompt',
      label: '增强提示词',
      type: 'text',
      description: '文本输入',
      required: false,
      defaultValue: '默认提示词',
      presets: ['预置一'],
    },
  ],
};

describe('formState', () => {
  it('应基于字段定义生成初始值', () => {
    expect(createInitialFormValues(demoApp)).toEqual({
      file: null,
      enable8k: true,
      prompt: '默认提示词',
    });
  });

  it('应根据必填字段判断是否可提交', () => {
    expect(hasRequiredFieldsReady(demoApp, createInitialFormValues(demoApp))).toBe(false);

    expect(
      hasRequiredFieldsReady(demoApp, {
        file: new File(['demo'], 'demo.png', { type: 'image/png' }),
        enable8k: true,
        prompt: '默认提示词',
      }),
    ).toBe(true);
  });
});
