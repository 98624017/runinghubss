import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { FileDropZone } from './FileDropZone';
import { SidebarNav } from './SidebarNav';
import { StatusBadge } from './StatusBadge';

describe('client components', () => {
  it('应渲染当前选中的导航项', () => {
    render(
      <SidebarNav
        apps={[
          {
            id: '2011111632956563457',
            slug: 'demo-a',
            title: 'A',
            shortTitle: 'A',
            description: 'alpha',
            chips: [],
            notes: [],
            nodeSummary: [],
            fields: [],
          },
          {
            id: '1993737411698032641',
            slug: 'demo-b',
            title: 'B',
            shortTitle: 'B',
            description: 'beta',
            chips: [],
            notes: [],
            nodeSummary: [],
            fields: [],
          },
        ]}
        selectedAppId="2011111632956563457"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: /A/u })).toHaveClass('is-selected');
  });

  it('应渲染状态徽标文本', () => {
    render(<StatusBadge tone="info" label="任务运行中" />);

    expect(screen.getByText('任务运行中')).toBeInTheDocument();
  });

  it('应提供图片上传输入并在选择后显示文件预览', async () => {
    const user = userEvent.setup();
    const file = new File(['hello'], 'demo.png', { type: 'image/png' });

    function Harness() {
      const [currentFile, setCurrentFile] = useState<File | null>(null);

      return (
        <FileDropZone
          label="上传图片"
          hint="测试"
          file={currentFile}
          onChange={setCurrentFile}
        />
      );
    }

    render(<Harness />);

    await user.upload(screen.getByLabelText('上传图片'), file);

    expect(screen.getByText('已选择文件')).toBeInTheDocument();
    expect(screen.getByText(/demo\.png/u)).toBeInTheDocument();
    expect(screen.getByAltText('上传图片预览')).toBeInTheDocument();
  });
});
