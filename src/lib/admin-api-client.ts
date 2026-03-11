import { useAdminStore } from "./stores/admin-store";

export async function adminApiClient<T>(
  url: string,
  options?: RequestInit & { rawBody?: boolean }
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = useAdminStore.getState().token;
  const isFormData = options?.body instanceof FormData;

  const headers: Record<string, string> = {
    // FormData 时不设 Content-Type，让浏览器自动处理 multipart boundary
    ...(!isFormData && !options?.rawBody ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 移除自定义属性，避免传递给 fetch
  const { rawBody: _, ...fetchOptions } = options ?? {};

  const res = await fetch(url, { ...fetchOptions, headers });

  // 401 时清除 token
  if (res.status === 401) {
    useAdminStore.getState().clearToken();
  }

  return res.json();
}
