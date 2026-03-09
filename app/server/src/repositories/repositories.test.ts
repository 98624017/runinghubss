import { afterEach, describe, expect, it } from 'vitest';

import { createTestDatabase } from '../db/testDatabase.js';
import { createAdminRepository } from './adminRepository.js';
import { createApiKeyArchiveRepository } from './apiKeyArchiveRepository.js';
import { createAppRepository } from './appRepository.js';
import { createSystemConfigRepository } from './systemConfigRepository.js';
import { createTaskRepository } from './taskRepository.js';

describe('repositories', () => {
  const openedPools: Array<{ end(): Promise<void> }> = [];

  afterEach(async () => {
    while (openedPools.length > 0) {
      const pool = openedPools.pop();
      if (pool) {
        await pool.end();
      }
    }
  });

  it('应支持初始化管理员、应用、schema、key 归档、任务与系统配置', async () => {
    const database = await createTestDatabase();
    openedPools.push(database.pool);

    const adminRepository = createAdminRepository(database.pool);
    const appRepository = createAppRepository(database.pool);
    const apiKeyArchiveRepository = createApiKeyArchiveRepository(database.pool);
    const taskRepository = createTaskRepository(database.pool);
    const systemConfigRepository = createSystemConfigRepository(database.pool);

    const admin = await adminRepository.findOrCreateDefaultAdmin({
      username: 'admin',
      passwordHash: 'hashed-password',
    });
    expect(admin.username).toBe('admin');
    expect(admin.passwordHash).toBe('hashed-password');

    const app = await appRepository.createApp({
      slug: 'one-click-colorize',
      displayName: '一键彩平',
      subtitle: '室内平面图快速彩平',
      description: '上传平面图，输出彩平图。',
      coverImageUrl: 'https://example.com/colorize-cover.jpg',
      tags: ['彩平', '平面图'],
      sortOrder: 1,
      isEnabled: true,
      usageTips: ['建议上传清晰平面图'],
      resultTips: ['结果链接可能失效，请及时下载'],
      upstreamAppId: '1994388299756212225',
      instanceType: 'default',
      usePersonalQueue: false,
      pollIntervalMs: 5000,
      maxPollAttempts: 24,
      timeoutSeconds: 600,
      maxConcurrencyPerKey: 2,
    });
    expect(app.displayName).toBe('一键彩平');
    expect(app.upstreamAppId).toBe('1994388299756212225');

    const schema = await appRepository.saveSchema({
      appId: app.id,
      schemaVersion: 1,
      layoutSchema: {
        sections: [{ key: 'basic', title: '基础参数' }],
      },
      fieldSchema: {
        groups: [{ key: 'basic', fields: ['file', 'prompt'] }],
      },
      resultSchema: {
        tips: ['结果链接可能失效，请及时下载'],
      },
      isPublished: true,
    });
    expect(schema.appId).toBe(app.id);
    expect(schema.isPublished).toBe(true);

    const publishedApps = await appRepository.listPublishedApps();
    expect(publishedApps).toHaveLength(1);
    expect(publishedApps[0]).toEqual(
      expect.objectContaining({
        slug: 'one-click-colorize',
        displayName: '一键彩平',
      }),
    );

    const keyArchive = await apiKeyArchiveRepository.findOrCreateArchive({
      apiKeyHash: 'hash-demo-key',
      apiKeyMasked: 'dem***key',
    });
    expect(keyArchive.apiKeyHash).toBe('hash-demo-key');
    expect(keyArchive.displayMultiplier).toBeNull();

    await apiKeyArchiveRepository.updateBalanceSnapshot({
      archiveId: keyArchive.id,
      displayMultiplier: 1.5,
      lastCheckedBalance: '100',
      lastCheckedDisplayBalance: '150',
      status: 'ready',
    });
    const updatedKeyArchive = await apiKeyArchiveRepository.findByHash('hash-demo-key');
    expect(updatedKeyArchive?.lastCheckedDisplayBalance).toBe('150');

    const task = await taskRepository.createTask({
      taskNo: 'TASK-001',
      appId: app.id,
      apiKeyArchiveId: keyArchive.id,
      status: 'queued',
      source: 'public-web',
      inputSnapshot: { prompt: '现代客厅' },
      normalizedParams: { prompt: '现代客厅', width: '1600' },
    });
    expect(task.taskNo).toBe('TASK-001');

    await taskRepository.appendEvent({
      taskId: task.id,
      eventType: 'task.created',
      eventPayload: {
        source: 'public-web',
      },
    });

    await taskRepository.updateTaskState({
      taskId: task.id,
      status: 'running',
      upstreamTaskId: 'upstream-001',
      upstreamStatus: 'RUNNING',
    });

    const taskDetail = await taskRepository.findTaskByTaskNo('TASK-001');
    expect(taskDetail).toEqual(
      expect.objectContaining({
        status: 'running',
        upstreamTaskId: 'upstream-001',
      }),
    );

    const events = await taskRepository.listEvents(task.id);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('task.created');

    const config = await systemConfigRepository.upsertConfig({
      key: 'site.branding',
      value: {
        brandName: '设计云台',
      },
    });
    expect(config.configKey).toBe('site.branding');

    const loadedConfig = await systemConfigRepository.findConfig('site.branding');
    expect(loadedConfig?.configValue).toEqual({
      brandName: '设计云台',
    });
  });
});
