import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { Pool } from 'pg';

import { createTaskRepository } from '../repositories/taskRepository.js';
import { normalizeTaskState } from '../services/payloadBuilders.js';
import { sanitizePayload, sanitizePublicMessage } from '../services/sanitize.js';
import { buildResultSnapshot } from '../services/taskLifecycle.js';
import type { createTaskDispatcher } from '../services/taskDispatcher.js';
import type { RunningHubClient } from '../services/runninghubClient.js';

function readApiKey(request: { header(name: string): string | undefined; query: any }) {
  return request.header('x-runninghub-api-key') || String(request.query.apiKey || '');
}

function pickMessage(apiKey: string, ...payloads: Array<{ msg?: unknown } | undefined>) {
  const message = payloads
    .map((payload) => payload?.msg)
    .find((value) => typeof value === 'string' && value && value !== 'success');
  return typeof message === 'string' ? sanitizePublicMessage(message, apiKey) : undefined;
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
  const firstWithCost = outputsPayload.data.find(
    (item: any) => typeof item?.taskCostTime === 'number' || typeof item?.taskCostTime === 'string',
  );
  if (!firstWithCost) {
    return null;
  }
  const cost = Number(firstWithCost.taskCostTime);
  return Number.isFinite(cost) ? cost : null;
}

export function createTasksRouter(
  client: RunningHubClient,
  options: { pool?: Pool; taskDispatcher?: ReturnType<typeof createTaskDispatcher> } = {},
): Router {
  const router = createRouter();
  const taskRepository = options.pool ? createTaskRepository(options.pool) : null;

  router.get('/:taskId/status', async (req, res) => {
    const taskId = req.params.taskId;
    if (taskRepository) {
      let task = await taskRepository.findTaskByTaskNo(taskId);
      if (
        task &&
        options.taskDispatcher &&
        ['queued', 'submitted', 'running'].includes(task.status)
      ) {
        await options.taskDispatcher.pollTaskNow(task.id);
        task = await taskRepository.findTaskByTaskNo(taskId);
      }
      if (task) {
        return res.json({
          ok: true,
          taskId,
          state: task.status,
          message: task.errorMessage || undefined,
          outputsReady: task.status === 'succeeded',
        });
      }
    }

    const apiKey = readApiKey(req);
    if (!apiKey) {
      return res.status(400).json({ message: '缺少服务密钥' });
    }
    const statusPayload = await client.queryStatus(apiKey, taskId);
    const outputsPayload = await client.queryOutputs(apiKey, taskId);
    const state = normalizeTaskState(statusPayload, outputsPayload);
    return res.json({
      ok: true,
      taskId,
      state,
      message: pickMessage(apiKey, outputsPayload, statusPayload),
      outputsReady: state === 'succeeded',
      debug: sanitizePayload({ statusPayload, outputsPayload }, apiKey),
    });
  });

  router.get('/:taskId/result', async (req, res) => {
    const taskId = req.params.taskId;
    if (taskRepository) {
      let task = await taskRepository.findTaskByTaskNo(taskId);
      if (
        task &&
        options.taskDispatcher &&
        ['queued', 'submitted', 'running'].includes(task.status)
      ) {
        await options.taskDispatcher.pollTaskNow(task.id);
        task = await taskRepository.findTaskByTaskNo(taskId);
      }
      if (task) {
        const resultSnapshot = task.resultSnapshot ?? buildResultSnapshot({ data: [] });
        const normalizedOutputs = Array.isArray((resultSnapshot as any).outputs)
          ? (resultSnapshot as any).outputs
          : Array.isArray((resultSnapshot as any).rawOutputs)
            ? (resultSnapshot as any).rawOutputs
            : [];
        return res.json({
          ok: true,
          taskId,
          state: task.status,
          message: task.errorMessage || undefined,
          outputUrls: resultSnapshot.outputUrls ?? [],
          taskCostTime: resultSnapshot.taskCostTime ?? null,
          outputs: normalizedOutputs,
        });
      }
    }

    const apiKey = readApiKey(req);
    if (!apiKey) {
      return res.status(400).json({ message: '缺少服务密钥' });
    }
    const outputsPayload = await client.queryOutputs(apiKey, taskId);
    const state = normalizeTaskState({ data: { status: 'RUNNING' } }, outputsPayload);
    return res.json({
      ok: true,
      taskId,
      state,
      message: pickMessage(apiKey, outputsPayload),
      outputUrls: extractOutputUrls(outputsPayload),
      taskCostTime: extractTaskCostTime(outputsPayload),
      usage: sanitizePayload(outputsPayload?.usage ?? null, apiKey),
      outputs: sanitizePayload(outputsPayload, apiKey),
    });
  });

  return router;
}
