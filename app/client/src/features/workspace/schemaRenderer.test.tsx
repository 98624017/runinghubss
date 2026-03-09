import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AppDefinition } from '../../types';
import { createInitialFormValues } from '../apps/formState';
import { SchemaRenderer } from './schemaRenderer';

const demoApp: AppDefinition = {
  id: '1994388299756212225',
  slug: 'color-plan',
  title: '一键彩平',
  shortTitle: '一键彩平',
  description: '将平面白图转换为彩平效果图。',
  chips: ['彩平'],
  notes: ['结果链接可能失效，请及时下载'],
  nodeSummary: [],
  layoutSchema: {
    sections: [
      { key: 'inputs', title: '素材上传' },
      { key: 'settings', title: '参数设置' },
    ],
  },
  resultSchema: {
    sections: [
      {
        key: 'results',
        title: '结果说明',
        description: '链接可能失效，请及时下载',
      },
    ],
  },
  fields: [
    {
      key: 'file',
      label: '上传平面图',
      type: 'file',
      description: '上传待处理的平面白图',
      required: true,
      accept: 'image/*',
      sectionKey: 'inputs',
    },
    {
      key: 'prompt',
      label: '风格提示',
      type: 'text',
      description: '补充空间风格与材质要求',
      required: true,
      defaultValue: '现代暖木风格',
      sectionKey: 'settings',
    },
    {
      key: 'width',
      label: '输出宽度',
      type: 'text',
      description: '建议 1600',
      required: true,
      defaultValue: '1600',
      control: 'input',
      sectionKey: 'settings',
    },
    {
      key: 'height',
      label: '输出高度',
      type: 'text',
      description: '建议 1600',
      required: true,
      defaultValue: '1600',
      control: 'input',
      sectionKey: 'settings',
    },
  ],
};

describe('SchemaRenderer', () => {
  it('应按 schema 分组渲染字段、默认值与结果说明', () => {
    render(
      <SchemaRenderer
        app={demoApp}
        value={createInitialFormValues(demoApp)}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole('heading', { name: '素材上传' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '参数设置' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '结果说明' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('上传平面图')).toBeInTheDocument();
    expect(screen.getByLabelText('风格提示')).toHaveValue('现代暖木风格');
    expect(screen.getByLabelText('输出宽度')).toHaveValue('1600');
    expect(screen.getByLabelText('输出高度')).toHaveValue('1600');
    expect(screen.getByText('结果链接可能失效，请及时下载')).toBeInTheDocument();
  });
});
