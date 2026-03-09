const API_KEY_PLACEHOLDER = '<SERVICE_API_KEY>';

function replaceBrandingTerms(message: string) {
  return message
    .replace(/https?:\/\/www\.runninghub\.cn/giu, '上游服务')
    .replace(/www\.runninghub\.cn/giu, '上游服务')
    .replace(/x-runninghub-api-key/giu, '服务密钥')
    .replace(/runninghub/giu, '上游服务');
}

export function maskApiKey(apiKey: string, visible = 4): string {
  if (!apiKey) return '';
  if (apiKey.length <= visible * 2) {
    return '*'.repeat(apiKey.length);
  }
  return `${apiKey.slice(0, visible)}${'*'.repeat(apiKey.length - visible * 2)}${apiKey.slice(-visible)}`;
}

export function sanitizePayload<T>(payload: T, apiKey: string): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item, apiKey)) as T;
  }
  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload as Record<string, unknown>).map(([key, value]) => {
        if (key === 'apiKey' || key === 'apikey') {
          return [key, API_KEY_PLACEHOLDER];
        }
        return [key, sanitizePayload(value, apiKey)];
      }),
    ) as T;
  }
  if (typeof payload === 'string') {
    return payload.replaceAll(apiKey, API_KEY_PLACEHOLDER) as T;
  }
  return payload;
}

export function sanitizePublicMessage(message: string, apiKey: string): string {
  const maskedMessage = apiKey ? message.replaceAll(apiKey, API_KEY_PLACEHOLDER) : message;
  return replaceBrandingTerms(maskedMessage).replace(/缺少\s+服务密钥/gu, '缺少服务密钥');
}

export function sanitizeError(error: unknown, apiKey: string): { message: string } {
  if (error instanceof Error) {
    return { message: sanitizePublicMessage(error.message, apiKey) };
  }
  return { message: '未知错误' };
}
