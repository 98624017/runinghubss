import { describe, expect, it } from 'vitest';

import { clearStoredServiceKey, loadStoredServiceKey, saveStoredServiceKey } from './keyStorage';

describe('keyStorage', () => {
  it('应支持保存、读取与清空服务密钥', () => {
    window.localStorage.clear();

    expect(loadStoredServiceKey()).toBe('');

    saveStoredServiceKey('sk-demo-key');
    expect(loadStoredServiceKey()).toBe('sk-demo-key');

    clearStoredServiceKey();
    expect(loadStoredServiceKey()).toBe('');
  });
});
