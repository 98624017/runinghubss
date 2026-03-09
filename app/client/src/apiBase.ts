type EnvLike = {
  VITE_API_BASE_URL?: string;
};

export function getApiBaseUrl(env?: EnvLike): string {
  const envValue = env?.VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '';
  const baseUrl = String(envValue).trim();
  return baseUrl.replace(/\/+$/, '');
}

export function buildApiUrl(path: string, env?: EnvLike): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl(env);
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
