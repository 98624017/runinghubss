import { normalizeTaskState } from './payloadBuilders.js';

export function extractOutputUrls(outputsPayload: any): string[] {
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

export function extractTaskCostTime(outputsPayload: any): number | null {
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

export function buildTaskResultSnapshot(outputsPayload: any) {
  return {
    outputUrls: extractOutputUrls(outputsPayload),
    taskCostTime: extractTaskCostTime(outputsPayload),
    outputs: Array.isArray(outputsPayload?.data) ? outputsPayload.data : [],
    usage: outputsPayload?.usage ?? null,
  };
}

export const buildResultSnapshot = buildTaskResultSnapshot;

export function resolveLifecycleState(statusPayload: any, outputsPayload: any) {
  return normalizeTaskState(statusPayload, outputsPayload);
}

export function pickLifecycleMessage(statusPayload: any, outputsPayload: any) {
  const message = [outputsPayload?.msg, statusPayload?.msg, outputsPayload?.message, statusPayload?.message].find(
    (value) => typeof value === 'string' && value,
  );

  return typeof message === 'string' ? message : undefined;
}
