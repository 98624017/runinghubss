import { buildApiUrl } from '../../apiBase';
import type {
  DynamicFormValues,
  ExecuteResponse,
  SupportedAppId,
  TaskResultResponse,
  TaskStatusResponse,
} from '../../types';

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? '请求失败');
  }
  return payload;
}

function mapStatus(state: string | undefined): TaskStatusResponse['state'] {
  switch (state) {
    case 'succeeded':
      return 'SUCCESS';
    case 'failed':
      return 'FAILED';
    case 'running':
      return 'RUNNING';
    case 'submitted':
    case 'queued':
      return 'QUEUED';
    default:
      return 'UNKNOWN';
  }
}

function mapResultState(
  state: string | undefined,
  outputs: unknown[],
): TaskResultResponse['state'] {
  if (state === 'failed') {
    return 'FAILED';
  }
  if (outputs.length > 0 && state === 'succeeded') {
    return 'SUCCESS';
  }
  return 'PENDING';
}

function readOutputs(result: any) {
  if (Array.isArray(result?.outputs?.data)) {
    return result.outputs.data;
  }

  if (Array.isArray(result?.outputs)) {
    return result.outputs;
  }

  if (Array.isArray(result?.outputUrls)) {
    return result.outputUrls.map((fileUrl: string) => ({ fileUrl }));
  }

  return [];
}

export async function executeApp(
  appId: SupportedAppId,
  payload: {
    apiKey: string;
    formValues: DynamicFormValues;
  },
): Promise<ExecuteResponse> {
  const formData = new FormData();
  formData.append('apiKey', payload.apiKey);

  for (const [key, value] of Object.entries(payload.formValues)) {
    if (value instanceof File) {
      formData.append(key, value);
      continue;
    }
    if (typeof value === 'boolean') {
      formData.append(key, String(value));
      continue;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      formData.append(key, value);
    }
  }

  const response = await fetch(buildApiUrl(`/api/apps/${appId}/execute`), {
    method: 'POST',
    body: formData,
  });
  const result = await readJson(response);
  return {
    taskId: String(result.taskId),
    state: result.state === 'submitted' ? 'queued' : 'running',
    debug: result.debug,
  };
}

export async function fetchTaskStatus(
  taskId: string,
  apiKey: string,
): Promise<TaskStatusResponse> {
  const response = await fetch(buildApiUrl(`/api/tasks/${taskId}/status`), {
    headers: {
      'x-runninghub-api-key': apiKey,
    },
  });
  const result = await readJson(response);
  return {
    taskId: String(result.taskId ?? taskId),
    state: mapStatus(result.state),
    message: result.message,
    raw: result.debug ?? result,
  };
}

export async function fetchTaskResult(
  taskId: string,
  apiKey: string,
): Promise<TaskResultResponse> {
  const response = await fetch(buildApiUrl(`/api/tasks/${taskId}/result`), {
    headers: {
      'x-runninghub-api-key': apiKey,
    },
  });
  const result = await readJson(response);
  const outputs = readOutputs(result);
  return {
    taskId: String(result.taskId ?? taskId),
    state: mapResultState(result.state, outputs),
    outputs,
    message: result.message,
    raw: result.outputs ?? result,
  };
}
