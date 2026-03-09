import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_BASE_URL = 'https://www.runninghub.cn';

export class RunningHubApiError extends Error {
  constructor(message, { response = null, httpStatus = null } = {}) {
    const details = [];
    if (httpStatus !== null && httpStatus !== undefined) {
      details.push(`HTTP ${httpStatus}`);
    }
    if (response && typeof response === 'object') {
      const code = response.code;
      const msg = response.msg ?? response.message;
      if (code !== undefined || msg !== undefined) {
        details.push(`code=${code} msg=${msg}`);
      }
    }
    super(details.length ? `${message} | ${details.join(' ')}` : message);
    this.name = 'RunningHubApiError';
    this.response = response;
    this.httpStatus = httpStatus;
  }
}

export function maskApiKey(apiKey, visible = 4) {
  if (apiKey.length <= visible * 2) {
    return '*'.repeat(apiKey.length);
  }
  return `${apiKey.slice(0, visible)}${'*'.repeat(apiKey.length - visible * 2)}${apiKey.slice(-visible)}`;
}

export class RunningHubClient {
  constructor({
    apiKey,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = 60_000,
    fetchImpl = globalThis.fetch,
  }) {
    if (!apiKey) {
      throw new Error('缺少 apiKey');
    }
    if (typeof fetchImpl !== 'function') {
      throw new Error('当前环境缺少 fetch 实现');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/u, '');
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  buildHeaders({
    includeAuth = true,
    includeJson = true,
    extraHeaders = {},
  } = {}) {
    const headers = {
      Host: 'www.runninghub.cn',
      ...extraHeaders,
    };
    if (includeAuth) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  buildUrl(pathname, params = null) {
    const url = new URL(`${this.baseUrl}${pathname}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  async requestJson(
    method,
    pathname,
    {
      params = null,
      jsonBody = undefined,
      body = undefined,
      includeAuth = true,
      includeJson = true,
      extraHeaders = {},
    } = {},
  ) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.buildUrl(pathname, params), {
        method: method.toUpperCase(),
        headers: this.buildHeaders({ includeAuth, includeJson, extraHeaders }),
        body: body ?? (jsonBody === undefined ? undefined : JSON.stringify(jsonBody)),
        signal: controller.signal,
      });
      const rawText = await response.text();
      let payload;
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch (error) {
        throw new RunningHubApiError(`接口未返回 JSON：${rawText.slice(0, 200)}`, {
          httpStatus: response.status,
        });
      }
      if (response.status >= 400) {
        throw new RunningHubApiError('HTTP 请求失败', {
          response: payload,
          httpStatus: response.status,
        });
      }
      return payload;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async checkAccount({ includeAuth = true, includeBody = true } = {}) {
    const jsonBody = includeBody ? { apikey: this.apiKey } : {};
    return this.requestJson('POST', '/uc/openapi/accountStatus', {
      jsonBody,
      includeAuth,
    });
  }

  async getAiAppDemo(webappId, { includeAuth = true } = {}) {
    return this.requestJson('GET', '/api/webapp/apiCallDemo', {
      params: {
        apiKey: this.apiKey,
        webappId: String(webappId),
      },
      includeAuth,
      includeJson: false,
    });
  }

  async uploadFile(filePath) {
    const fileBuffer = await readFile(filePath);
    const fileName = path.basename(filePath);
    const formData = new FormData();
    formData.set('file', new Blob([fileBuffer]), fileName);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(
        `${this.baseUrl}/openapi/v2/media/upload/binary`,
        {
          method: 'POST',
          headers: this.buildHeaders({ includeJson: false }),
          body: formData,
          signal: controller.signal,
        },
      );
      const rawText = await response.text();
      let payload;
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch (error) {
        throw new RunningHubApiError(`上传接口未返回 JSON：${rawText.slice(0, 200)}`, {
          httpStatus: response.status,
        });
      }
      if (response.status >= 400) {
        throw new RunningHubApiError('上传接口 HTTP 失败', {
          response: payload,
          httpStatus: response.status,
        });
      }
      return payload;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async runAiApp({
    webappId,
    nodeInfoList,
    webhookUrl = undefined,
    instanceType = undefined,
  }) {
    const payload = {
      webappId: String(webappId),
      apiKey: this.apiKey,
      nodeInfoList,
    };
    if (webhookUrl) {
      payload.webhookUrl = webhookUrl;
    }
    if (instanceType) {
      payload.instanceType = instanceType;
    }
    return this.requestJson('POST', '/task/openapi/ai-app/run', {
      jsonBody: payload,
    });
  }

  async queryStatus(taskId, { includeAuth = true, includeBodyApiKey = true } = {}) {
    const payload = { taskId: String(taskId) };
    if (includeBodyApiKey) {
      payload.apiKey = this.apiKey;
    }
    return this.requestJson('POST', '/task/openapi/status', {
      jsonBody: payload,
      includeAuth,
    });
  }

  async queryOutputs(taskId, { includeAuth = true, includeBodyApiKey = true } = {}) {
    const payload = { taskId: String(taskId) };
    if (includeBodyApiKey) {
      payload.apiKey = this.apiKey;
    }
    return this.requestJson('POST', '/task/openapi/outputs', {
      jsonBody: payload,
      includeAuth,
    });
  }

  async queryV2(taskId, { includeAuth = true } = {}) {
    return this.requestJson('POST', '/openapi/v2/query', {
      jsonBody: { taskId: String(taskId) },
      includeAuth,
    });
  }

  async saveJson(targetPath, payload) {
    await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }
}
