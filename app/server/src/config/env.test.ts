import { describe, expect, it } from 'vitest';

import { readServerEnv } from './env.js';

describe('readServerEnv', () => {
  it('应读取服务端关键环境变量并应用默认值', () => {
    const env = readServerEnv({
      PORT: '3001',
      DATABASE_URL: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
      ADMIN_PATH: '/secret-admin',
      ADMIN_DEFAULT_USERNAME: 'admin',
      ADMIN_DEFAULT_PASSWORD: 'change-me',
      SESSION_SECRET: 'session-secret',
    });

    expect(env).toEqual({
      port: 3001,
      databaseUrl: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
      adminPath: '/secret-admin',
      adminDefaultUsername: 'admin',
      adminDefaultPassword: 'change-me',
      sessionSecret: 'session-secret',
      nodeEnv: 'development',
    });
  });

  it('在可选值缺省时应提供合理默认值', () => {
    const env = readServerEnv({
      DATABASE_URL: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
      ADMIN_DEFAULT_USERNAME: 'admin',
      ADMIN_DEFAULT_PASSWORD: 'change-me',
      SESSION_SECRET: 'session-secret',
    });

    expect(env.port).toBe(8787);
    expect(env.adminPath).toBe('/admin-console');
    expect(env.nodeEnv).toBe('development');
  });

  it('缺少关键环境变量时应抛出明确错误', () => {
    expect(() =>
      readServerEnv({
        DATABASE_URL: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
        ADMIN_DEFAULT_USERNAME: 'admin',
      }),
    ).toThrowError('缺少必要环境变量：ADMIN_DEFAULT_PASSWORD, SESSION_SECRET');
  });

  it('端口不是合法数字时应抛出明确错误', () => {
    expect(() =>
      readServerEnv({
        PORT: 'abc',
        DATABASE_URL: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
        ADMIN_DEFAULT_USERNAME: 'admin',
        ADMIN_DEFAULT_PASSWORD: 'change-me',
        SESSION_SECRET: 'session-secret',
      }),
    ).toThrowError('环境变量 PORT 必须是合法数字');
  });
});
