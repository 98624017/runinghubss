import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DebugDrawer } from './DebugDrawer';

describe('DebugDrawer', () => {
  it('应能展开调试信息且不显示明文 api key', async () => {
    const user = userEvent.setup();

    render(
      <DebugDrawer
        accountDebug={{ apiKey: '1234567890abcdef1234567890abcdef' }}
        executeDebug={{
          headers: {
            'x-runninghub-api-key': '1234567890abcdef1234567890abcdef',
          },
        }}
        statusDebug={null}
        resultDebug={null}
        developerNotes={['后端返回已做脱敏，前端再次兜底。']}
      />,
    );

    await user.click(screen.getByRole('button', { name: '展开开发调试信息' }));

    expect(screen.getByText('账户检查')).toBeInTheDocument();
    expect(screen.getByText('任务提交')).toBeInTheDocument();
    expect(screen.getByText('开发备注')).toBeInTheDocument();
    expect(screen.queryByText('1234567890abcdef1234567890abcdef')).not.toBeInTheDocument();
  });
});
