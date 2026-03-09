import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import type { Pool } from 'pg';

import { createAppRepository } from '../repositories/appRepository.js';
import { createApiKeyArchiveRepository } from '../repositories/apiKeyArchiveRepository.js';
import { createTaskRepository } from '../repositories/taskRepository.js';
import { hashApiKey as buildApiKeyHash } from './balanceDisplay.js';
import { normalizeTaskState } from './payloadBuilders.js';
import { maskApiKey } from './sanitize.js';

type DispatcherClient = {
  runAiApp(apiKey: string, payload: Record<string, unknown>): Promise<any>;
  queryStatus(apiKey: string, taskId: string): Promise<any>;
  queryOutputs(apiKey: string, taskId: string): Promise<any>;
};

function createTaskNo() {
  return `TASK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function buildSecretKey(secret: string) {
  return createHash('sha256').update(secret).digest();
}

function extractOutputUrls(outputsPayload: any): string[] {
  if (!Array.isArray(outputsPayload?.data)) {
    return [];
  }

  return outputsPayload.data.flatMap((item: any) => {
    if (typeof item?.fileUrl === 'string') {
      return [item.fileUrl];
    }
    if (typeof item?.downloadUrl === 'string') {
      return [item.downloadUrl];
    }
    return [];
  });
}

function extractTaskCostTime(outputsPayload: any): number | null {
  if (!Array.isArray(outputsPayload?.data)) {
    return null;
  }

  const itemWithCost = outputsPayload.data.find(
    (item: any) => typeof item?.taskCostTime === 'number' || typeof item?.taskCostTime === 'string',
  );
  if (!itemWithCost) {
    return null;
  }

  const taskCostTime = Number(itemWithCost.taskCostTime);
  return Number.isFinite(taskCostTime) ? taskCostTime : null;
}

export function encryptTaskApiKey(apiKey: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', buildSecretKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptTaskApiKey(ciphertext: string, secret: string) {
  const [ivPart, authTagPart, encryptedPart] = ciphertext.split('.');
  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error('任务 API Key 密文格式非法');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    buildSecretKey(secret),
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagPart, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function createTaskDispatcher(options: {
  pool: Pool;
  sessionSecret: string;
  client: DispatcherClient;
}) {
  const appRepository = createAppRepository(options.pool);
  const taskRepository = createTaskRepository(options.pool);
  const apiKeyArchiveRepository = createApiKeyArchiveRepository(options.pool);

  async function pollTaskNow(taskId: number) {
    const task = await taskRepository.findTaskById(taskId);
    if (!task || !task.upstreamTaskId || !task.activeApiKeyCiphertext) {
      return task;
    }

    const apiKey = decryptTaskApiKey(task.activeApiKeyCiphertext, options.sessionSecret);
    const statusPayload = await options.client.queryStatus(apiKey, task.upstreamTaskId);
    const outputsPayload = await options.client.queryOutputs(apiKey, task.upstreamTaskId);
    const state = normalizeTaskState(statusPayload, outputsPayload);

    if (state === 'succeeded') {
      const updatedTask = await taskRepository.updateTaskResult({
        taskId,
        status: 'succeeded',
        resultSnapshot: {
          outputUrls: extractOutputUrls(outputsPayload),
          taskCostTime: extractTaskCostTime(outputsPayload),
          outputs: Array.isArray(outputsPayload?.data) ? outputsPayload.data : [],
        },
      });
      await taskRepository.updateTaskState({
        taskId,
        status: 'succeeded',
        activeApiKeyCiphertext: null,
      });
      await taskRepository.appendEvent({
        taskId,
        eventType: 'task.succeeded',
        eventPayload: {
          outputUrls: extractOutputUrls(outputsPayload),
          taskCostTime: extractTaskCostTime(outputsPayload),
        },
      });
      return taskRepository.findTaskById(updatedTask.id);
    }

    if (state === 'failed') {
      await taskRepository.updateTaskState({
        taskId,
        status: 'failed',
        activeApiKeyCiphertext: null,
        errorMessage: typeof outputsPayload?.msg === 'string' ? outputsPayload.msg : '任务执行失败',
      });
      await taskRepository.appendEvent({
        taskId,
        eventType: 'task.failed',
        eventPayload: {
          statusPayload,
          outputsPayload,
        },
      });
      return taskRepository.findTaskById(taskId);
    }

    return task;
  }

  return {
    apiKeyArchiveRepository,
    hashApiKey: buildApiKeyHash,

    async submitTask(input: {
      upstreamAppId: string;
      apiKey: string;
      source: string;
      inputSnapshot: Record<string, unknown>;
      normalizedParams: Record<string, unknown>;
    }) {
      const app = await appRepository.findAppByUpstreamAppId(input.upstreamAppId);
      if (!app) {
        throw new Error(`未找到应用配置：${input.upstreamAppId}`);
      }

      const archive = await apiKeyArchiveRepository.findOrCreateArchive({
        apiKeyHash: buildApiKeyHash(input.apiKey),
        apiKeyMasked: maskApiKey(input.apiKey),
      });

      const task = await taskRepository.createTask({
        taskNo: createTaskNo(),
        appId: app.id,
        apiKeyArchiveId: archive.id,
        status: 'queued',
        source: input.source,
        inputSnapshot: input.inputSnapshot,
        normalizedParams: input.normalizedParams,
        activeApiKeyCiphertext: encryptTaskApiKey(input.apiKey, options.sessionSecret),
      });
      await taskRepository.appendEvent({
        taskId: task.id,
        eventType: 'task.created',
        eventPayload: {
          source: input.source,
        },
      });

      const submitResult = await options.client.runAiApp(input.apiKey, input.normalizedParams);
      const upstreamTaskId = String(submitResult?.data?.taskId || '');
      const submittedTask = await taskRepository.updateTaskState({
        taskId: task.id,
        status: 'running',
        upstreamTaskId,
        upstreamStatus: 'RUNNING',
      });
      await taskRepository.appendEvent({
        taskId: task.id,
        eventType: 'task.submitted',
        eventPayload: {
          upstreamTaskId,
        },
      });

      return submittedTask;
    },

    async pollTaskNow(taskId: number) {
      return pollTaskNow(taskId);
    },

    async recoverPendingTasks() {
      const tasks = await taskRepository.listPendingTasks();
      return tasks
        .filter((task) => Boolean(task.upstreamTaskId) && Boolean(task.activeApiKeyCiphertext))
        .map((task) => task.id);
    },

    stop() {
      return Promise.resolve();
    },
  };
}
