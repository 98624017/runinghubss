import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestDatabase } from '../db/testDatabase.js';
import { createAppRepository } from '../repositories/appRepository.js';
import { createTaskRepository } from '../repositories/taskRepository.js';
import { createTaskDispatcher, encryptTaskApiKey } from './taskDispatcher.js';

describe('task dispatcher', () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (cleanups.length > 0) {
      const cleanup = cleanups.pop();
      if (cleanup) {
        await cleanup();
      }
    }
  });

  it('应提交本地任务、写入上游任务号并在轮询成功后落结果快照', async () => {
    const database = await createTestDatabase();
    cleanups.push(database.close);

    const appRepository = createAppRepository(database.pool as any);
    const dispatcher = createTaskDispatcher({
      pool: database.pool as any,
      sessionSecret: 'session-secret',
      client: {
        runAiApp: vi.fn(async () => ({ code: 0, data: { taskId: 'upstream-001' } })),
        queryStatus: vi.fn(async () => ({ code: 0, data: { status: 'RUNNING' } })),
        queryOutputs: vi
          .fn()
          .mockResolvedValueOnce({ code: 804, data: null })
          .mockResolvedValueOnce({
            code: 0,
            data: [
              {
                fileUrl: 'https://example.com/result.png',
                taskCostTime: 12,
              },
            ],
          }),
      } as any,
    });
    cleanups.push(async () => {
      dispatcher.stop();
    });

    await appRepository.createApp({
      slug: 'colorize',
      displayName: '一键彩平',
      subtitle: '快速生成彩平图',
      description: '将平面图转换成彩平图。',
      coverImageUrl: null,
      tags: ['彩平'],
      sortOrder: 1,
      isEnabled: true,
      usageTips: [],
      resultTips: [],
      upstreamAppId: '1994388299756212225',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 1,
      maxPollAttempts: 5,
      timeoutSeconds: 10,
      maxConcurrencyPerKey: 1,
    });

    const submittedTask = await dispatcher.submitTask({
      upstreamAppId: '1994388299756212225',
      apiKey: 'demo-key',
      source: 'public-web',
      inputSnapshot: { prompt: '现代木质客厅' },
      normalizedParams: {
        webappId: '1994388299756212225',
        nodeInfoList: [{ nodeId: '257', fieldName: 'image', fieldValue: 'demo.png' }],
      },
    });

    expect(submittedTask.status).toBe('running');
    expect(submittedTask.upstreamTaskId).toBe('upstream-001');

    await dispatcher.pollTaskNow(submittedTask.id);
    const completedTask = await dispatcher.pollTaskNow(submittedTask.id);

    expect(completedTask?.status).toBe('succeeded');
    expect(completedTask?.activeApiKeyCiphertext).toBeNull();
    expect(completedTask?.resultSnapshot).toEqual(
      expect.objectContaining({
        outputUrls: ['https://example.com/result.png'],
        taskCostTime: 12,
      }),
    );
  }, 15000);

  it('应能恢复未完成任务的轮询调度', async () => {
    const database = await createTestDatabase();
    cleanups.push(database.close);

    const appRepository = createAppRepository(database.pool as any);
    const taskRepository = createTaskRepository(database.pool as any);
    const dispatcher = createTaskDispatcher({
      pool: database.pool as any,
      sessionSecret: 'session-secret',
      client: {
        runAiApp: vi.fn(async () => ({ code: 0, data: { taskId: 'upstream-001' } })),
        queryStatus: vi.fn(async () => ({ code: 0, data: { status: 'RUNNING' } })),
        queryOutputs: vi.fn(async () => ({
          code: 0,
          data: [{ fileUrl: 'https://example.com/recovered.png', taskCostTime: 8 }],
        })),
      } as any,
    });
    cleanups.push(async () => {
      dispatcher.stop();
    });

    const app = await appRepository.createApp({
      slug: 'colorize',
      displayName: '一键彩平',
      subtitle: '快速生成彩平图',
      description: '将平面图转换成彩平图。',
      coverImageUrl: null,
      tags: ['彩平'],
      sortOrder: 1,
      isEnabled: true,
      usageTips: [],
      resultTips: [],
      upstreamAppId: '1994388299756212225',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 1,
      maxPollAttempts: 5,
      timeoutSeconds: 10,
      maxConcurrencyPerKey: 1,
    });

    const archive = await dispatcher.apiKeyArchiveRepository.findOrCreateArchive({
      apiKeyHash: dispatcher.hashApiKey('demo-key'),
      apiKeyMasked: 'demo****key',
    });
    const task = await taskRepository.createTask({
      taskNo: 'TASK-RECOVER-001',
      appId: app.id,
      apiKeyArchiveId: archive.id,
      status: 'running',
      source: 'public-web',
      inputSnapshot: { prompt: '恢复任务' },
      normalizedParams: {
        webappId: '1994388299756212225',
        nodeInfoList: [{ nodeId: '257', fieldName: 'image', fieldValue: 'demo.png' }],
      },
      activeApiKeyCiphertext: encryptTaskApiKey('demo-key', 'session-secret'),
    });
    await taskRepository.updateTaskState({
      taskId: task.id,
      status: 'running',
      upstreamTaskId: 'upstream-001',
      upstreamStatus: 'RUNNING',
    });

    const recoveredIds = await dispatcher.recoverPendingTasks();

    expect(recoveredIds).toContain(task.id);

    const recoveredTask = await dispatcher.pollTaskNow(task.id);
    expect(recoveredTask?.status).toBe('succeeded');
    expect(recoveredTask?.resultSnapshot).toEqual(
      expect.objectContaining({
        outputUrls: ['https://example.com/recovered.png'],
      }),
    );
  }, 15000);
});
