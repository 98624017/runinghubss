import { buildApiUrl } from '../../apiBase';
import type { HistoryTaskItem, HistoryTaskStatus } from '../../types';

type FetchHistoryInput = {
  apiKey: string;
  appSlug?: string;
  status?: HistoryTaskStatus | string;
};

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? '读取历史记录失败');
  }
  return payload;
}

function normalizeStatus(status: unknown): HistoryTaskStatus {
  switch (status) {
    case 'queued':
    case 'submitted':
    case 'running':
    case 'succeeded':
    case 'failed':
    case 'timeout':
    case 'cancelled':
      return status;
    default:
      return 'unknown';
  }
}

export async function fetchHistory(input: FetchHistoryInput): Promise<HistoryTaskItem[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('apiKey', input.apiKey);

  if (input.appSlug) {
    searchParams.set('appSlug', input.appSlug);
  }

  if (input.status) {
    searchParams.set('status', input.status);
  }

  const response = await fetch(buildApiUrl(`/api/history?${searchParams.toString()}`));
  const payload = await readJson(response);
  if (!Array.isArray(payload?.tasks)) {
    return [];
  }

  return payload.tasks.map((task: Record<string, unknown>) => ({
    taskId: String(task.taskId ?? ''),
    appSlug: typeof task.appSlug === 'string' ? task.appSlug : '',
    displayName: String(task.displayName ?? ''),
    status: normalizeStatus(task.status),
    submittedAt: typeof task.submittedAt === 'string' ? task.submittedAt : '',
    outputUrls: Array.isArray(task.outputUrls) ? task.outputUrls.map((item) => String(item)) : [],
    linkExpiryReminder:
      typeof task.linkExpiryReminder === 'string' ? task.linkExpiryReminder : '结果链接可能失效，请及时下载',
  }));
}
