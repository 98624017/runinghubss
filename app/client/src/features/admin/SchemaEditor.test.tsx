import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SchemaEditor, createEmptyAdminAppDraft, type AdminAppDraft } from './SchemaEditor';

describe('SchemaEditor', () => {
  it('应支持字段分组、排序、默认值、总体超时与结果说明配置', async () => {
    const user = userEvent.setup();

    function Harness() {
      const fields = [
        {
          key: 'file',
          label: '上传平面图',
          type: 'file' as const,
          description: '上传待处理素材',
          required: true,
          sectionKey: 'inputs',
        },
        {
          key: 'prompt',
          label: '风格提示',
          type: 'text' as const,
          description: '补充空间风格',
          required: true,
          sectionKey: 'settings',
          defaultValue: '现代暖木风',
        },
      ];
      const [value, setValue] = useState<AdminAppDraft>(() => ({
        ...createEmptyAdminAppDraft(),
        timeoutSeconds: 300,
        layoutSchema: {
          sections: [
            { key: 'inputs', title: '素材上传' },
            { key: 'settings', title: '参数设置' },
          ],
        },
        fieldSchema: {
          fields,
        },
        fields,
        resultSchema: {
          sections: [
            {
              key: 'results',
              title: '结果说明',
              description: '结果链接可能失效，请及时下载',
            },
          ],
        },
      }));

      return <SchemaEditor value={value} onChange={setValue} />;
    }

    render(<Harness />);

    expect(screen.getByRole('heading', { name: '素材上传' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '参数设置' })).toBeInTheDocument();

    const timeoutInput = screen.getByLabelText('总体超时时间（秒）');
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '900');
    expect(timeoutInput).toHaveValue(900);

    const defaultValueInput = screen.getByLabelText('默认值-风格提示');
    await user.clear(defaultValueInput);
    await user.type(defaultValueInput, '侘寂自然风');
    expect(defaultValueInput).toHaveValue('侘寂自然风');

    const fieldCards = screen.getAllByTestId('schema-field-card');
    expect(fieldCards[0]).toHaveTextContent('上传平面图');

    await user.click(screen.getByRole('button', { name: '下移-上传平面图' }));

    const reorderedCards = screen.getAllByTestId('schema-field-card');
    expect(reorderedCards[0]).toHaveTextContent('风格提示');

    const resultDescription = screen.getByLabelText('结果说明描述-results');
    await user.clear(resultDescription);
    await user.type(resultDescription, '请优先下载原图并留档');
    expect(resultDescription).toHaveValue('请优先下载原图并留档');
  });
});
