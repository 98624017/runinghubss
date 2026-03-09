import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as taskApi from './taskApi';
import { useTaskRunner } from './useTaskRunner';

describe('useTaskRunner', () => {
  it('应在成功后更新到完成态', async () => {
    vi.spyOn(taskApi, 'executeApp').mockResolvedValue({
      taskId: '42',
      state: 'queued',
      debug: { submit: true },
    });
    vi.spyOn(taskApi, 'fetchTaskStatus').mockResolvedValue({
      taskId: '42',
      state: 'SUCCESS',
      raw: { status: true },
    });
    vi.spyOn(taskApi, 'fetchTaskResult').mockResolvedValue({
      taskId: '42',
      state: 'SUCCESS',
      outputs: [{ fileUrl: 'https://example.com/result.png' }],
      raw: { result: true },
    });

    const { result } = renderHook(() => useTaskRunner('2011111632956563457'));

    await act(async () => {
      await result.current.run({
        apiKey: 'demo-key',
        formValues: {
          file: new File(['hello'], 'demo.png', { type: 'image/png' }),
          enable8k: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.phase).toBe('succeeded');
    });

    expect(result.current.taskId).toBe('42');
    expect(result.current.resultPayload?.outputs[0]?.fileUrl).toBe(
      'https://example.com/result.png',
    );
  });

  it('切换应用时应重置任务状态', async () => {
    vi.spyOn(taskApi, 'executeApp').mockResolvedValue({
      taskId: 'TASK-2',
      state: 'queued',
      debug: { submit: true },
    });
    vi.spyOn(taskApi, 'fetchTaskStatus').mockResolvedValue({
      taskId: 'TASK-2',
      state: 'SUCCESS',
      raw: { status: true },
    });
    vi.spyOn(taskApi, 'fetchTaskResult').mockResolvedValue({
      taskId: 'TASK-2',
      state: 'SUCCESS',
      outputs: [{ fileUrl: 'https://example.com/next-result.png' }],
      raw: { result: true },
    });

    const { result, rerender } = renderHook(
      ({ appId }) => useTaskRunner(appId),
      { initialProps: { appId: '1994388299756212225' } },
    );

    await act(async () => {
      await result.current.run({
        apiKey: 'demo-key',
        formValues: {
          file: new File(['hello'], 'demo.png', { type: 'image/png' }),
          prompt: '现代暖木风格',
        },
      });
    });

    await waitFor(() => {
      expect(result.current.phase).toBe('succeeded');
    });

    rerender({ appId: '2011111632956563457' });

    await waitFor(() => {
      expect(result.current.phase).toBe('idle');
      expect(result.current.taskId).toBeNull();
      expect(result.current.resultPayload).toBeNull();
    });
  });
});
