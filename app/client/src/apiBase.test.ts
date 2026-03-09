import { describe, expect, it } from 'vitest';

import { buildApiUrl, getApiBaseUrl } from './apiBase';

describe('apiBase', () => {
  it('默认使用同源相对路径，便于开发代理与生产同源部署', () => {
    expect(getApiBaseUrl({ VITE_API_BASE_URL: '' })).toBe('');
    expect(buildApiUrl('/api/health', { VITE_API_BASE_URL: '' })).toBe('/api/health');
  });

  it('支持自定义环境变量基址', () => {
    expect(getApiBaseUrl({ VITE_API_BASE_URL: 'https://demo.example.com/' })).toBe(
      'https://demo.example.com',
    );
    expect(buildApiUrl('api/account/check', { VITE_API_BASE_URL: 'https://demo.example.com/' })).toBe(
      'https://demo.example.com/api/account/check',
    );
  });
});
