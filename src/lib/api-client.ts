import { useApiKeyStore } from "./stores/api-key-store";

export async function apiClient<T>(
  url: string,
  options?: RequestInit & { skipApiKey?: boolean }
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { apiKey } = useApiKeyStore.getState();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (!options?.skipApiKey && apiKey) {
    headers["x-api-key"] = apiKey;
  }

  // 非 FormData 请求默认 JSON
  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  return res.json();
}
