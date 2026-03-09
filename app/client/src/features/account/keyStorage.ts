const STORAGE_KEY = 'white-label-ai.personal-api-key';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadStoredApiKey() {
  if (!canUseStorage()) {
    return '';
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveStoredApiKey(apiKey: string) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, apiKey);
  } catch {}
}

export function clearStoredApiKey() {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export const loadStoredServiceKey = loadStoredApiKey;
export const saveStoredServiceKey = saveStoredApiKey;
export const clearStoredServiceKey = clearStoredApiKey;
