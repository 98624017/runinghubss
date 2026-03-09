import { useAdminStore } from "./stores/admin-store";

export async function adminApiClient<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = useAdminStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  // 401 时清除 token
  if (res.status === 401) {
    useAdminStore.getState().clearToken();
  }

  return res.json();
}
