import { RunningHubApiError } from '../errors.js';
import { sanitizePayload } from './sanitize.js';

export const DEFAULT_BASE_URL = 'https://www.runninghub.cn';

export interface UploadFileInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface RunningHubClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class RunningHubClient {
  private readonly baseUrl: string;

  private readonly fetchImpl: typeof fetch;

  constructor(options: RunningHubClientOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/u, '');
    this.fetchImpl = options.fetchImpl || fetch;
  }

  buildHeaders(apiKey: string, includeJson = true): HeadersInit {
    return {
      Host: 'www.runninghub.cn',
      Authorization: `Bearer ${apiKey}`,
      ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    };
  }

  private async requestJson<T>(
    apiKey: string,
    method: 'GET' | 'POST',
    path: string,
    options: {
      params?: Record<string, string>;
      jsonBody?: unknown;
      body?: BodyInit;
      includeJson?: boolean;
      allowedCodes?: number[];
    } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(options.params || {})) {
      url.searchParams.set(key, value);
    }

    const response = await this.fetchImpl(url, {
      method,
      headers: this.buildHeaders(apiKey, options.includeJson ?? true),
      body:
        options.body ??
        (options.jsonBody !== undefined ? JSON.stringify(options.jsonBody) : undefined),
    });

    const text = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`RunningHub 未返回 JSON：${text.slice(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(`RunningHub HTTP 失败：${response.status} ${text.slice(0, 300)}`);
    }

    const businessPayload = payload as { code?: number; msg?: string };
    if (
      Array.isArray(options.allowedCodes) &&
      typeof businessPayload.code === 'number' &&
      !options.allowedCodes.includes(businessPayload.code)
    ) {
      const sanitizedPayload = sanitizePayload(businessPayload, apiKey);
      const reason = [sanitizedPayload.code, sanitizedPayload.msg].filter(Boolean).join(' ');
      throw new RunningHubApiError(`RunningHub 业务失败：${reason || '未知错误'}`, {
        upstreamCode: sanitizedPayload.code,
        upstreamPayload: sanitizedPayload,
      });
    }

    return payload as T;
  }

  async checkAccount(apiKey: string) {
    return this.requestJson<any>(apiKey, 'POST', '/uc/openapi/accountStatus', {
      jsonBody: { apikey: apiKey },
      allowedCodes: [0],
    });
  }

  async uploadFile(apiKey: string, input: UploadFileInput) {
    const formData = new FormData();
    const bytes = Uint8Array.from(input.buffer);
    formData.append(
      'file',
      new Blob([bytes], { type: input.mimeType || 'application/octet-stream' }),
      input.filename,
    );
    return this.requestJson<any>(apiKey, 'POST', '/openapi/v2/media/upload/binary', {
      body: formData,
      includeJson: false,
      allowedCodes: [0],
    });
  }

  async runAiApp(
    apiKey: string,
    payload: {
      webappId: string;
      nodeInfoList: Array<{ nodeId: string; fieldName: string; fieldValue: string }>;
    },
  ) {
    return this.requestJson<any>(apiKey, 'POST', '/task/openapi/ai-app/run', {
      jsonBody: {
        webappId: payload.webappId,
        apiKey,
        nodeInfoList: payload.nodeInfoList,
      },
      allowedCodes: [0],
    });
  }

  async queryStatus(apiKey: string, taskId: string) {
    return this.requestJson<any>(apiKey, 'POST', '/task/openapi/status', {
      jsonBody: { taskId, apiKey },
    });
  }

  async queryOutputs(apiKey: string, taskId: string) {
    return this.requestJson<any>(apiKey, 'POST', '/task/openapi/outputs', {
      jsonBody: { taskId, apiKey },
    });
  }
}

export function sanitizeRunningHubDebug<T>(payload: T, apiKey: string): T {
  return sanitizePayload(payload, apiKey);
}
