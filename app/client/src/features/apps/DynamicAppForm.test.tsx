import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { AppDefinition } from '../../types';
import { DynamicAppForm } from './DynamicAppForm';
import { createInitialFormValues } from './formState';

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
      label: '主输入图',
      type: 'file',
      description: '上传一张图片',
      required: true,
      accept: 'image/*',
    },
    {
      key: 'enable8k',
      label: '开启 8K',
      type: 'boolean',
      description: '布尔开关',
      required: false,
      defaultValue: false,
    },
    {
      key: 'prompt',
      label: '自定义提示',
      type: 'text',
      description: '输入增强提示',
      required: false,
      defaultValue: '',
      presets: ['预置提示词 A'],
    },
  ],
};

describe('DynamicAppForm', () => {
  it('应根据字段定义渲染文件、布尔和文本控件', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState(createInitialFormValues(demoApp));

      return <DynamicAppForm app={demoApp} value={value} onChange={setValue} />;
    }

    render(<Harness />);

    expect(screen.getByLabelText('主输入图')).toBeInTheDocument();
    expect(screen.getByLabelText('开启 8K')).toBeInTheDocument();
    expect(screen.getByLabelText('自定义提示')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '预置提示词 A' }));

    expect(screen.getByLabelText('自定义提示')).toHaveValue('预置提示词 A');
  });
});
