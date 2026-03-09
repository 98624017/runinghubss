import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { ServerEnv } from '../config/env.js';
import { createTestDatabase } from '../db/testDatabase.js';
import { createApp } from '../app.js';

function createMockClient() {
  return {
    checkAccount: vi.fn(async () => ({ code: 0, data: { remainCoins: '100' } })),
    uploadFile: vi.fn(async () => ({ code: 0, data: { fileName: 'openapi/demo.png' } })),
    runAiApp: vi.fn(async () => ({ code: 0, data: { taskId: '42' } })),
    queryStatus: vi.fn(async () => ({ code: 0, data: { status: 'RUNNING' } })),
    queryOutputs: vi.fn(async () => ({ code: 804, data: null })),
  };
}

function createAdminEnv(): ServerEnv {
  return {
    port: 8787,
    databaseUrl: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
    adminPath: '/admin-console',
    adminDefaultUsername: 'admin',
    adminDefaultPassword: 'change-me',
    sessionSecret: 'session-secret',
    nodeEnv: 'test',
  };
}

describe('admin auth routes', () => {
  it('应支持默认管理员登录、读取当前身份并登出', async () => {
    const database = await createTestDatabase();
    const app = createApp(createMockClient() as any, {
      env: createAdminEnv(),
      pool: database.pool as any,
    });

    try {
      const unauthenticated = await request(app).get('/api/admin/auth/me');
      expect(unauthenticated.status).toBe(401);

      const loginResponse = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'change-me',
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.ok).toBe(true);
      expect(loginResponse.body.admin).toEqual(
        expect.objectContaining({
          username: 'admin',
        }),
      );

      const cookie = loginResponse.headers['set-cookie']?.[0];
      expect(cookie).toContain('rh_admin_session=');
      expect(cookie).toContain('HttpOnly');

      const meResponse = await request(app).get('/api/admin/auth/me').set('Cookie', cookie);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.admin).toEqual(
        expect.objectContaining({
          username: 'admin',
        }),
      );

      const logoutResponse = await request(app).post('/api/admin/auth/logout').set('Cookie', cookie);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.headers['set-cookie']?.[0]).toContain('Max-Age=0');
    } finally {
      await database.close();
    }
  });

  it('密码错误时应返回 401', async () => {
    const database = await createTestDatabase();
    const app = createApp(createMockClient() as any, {
      env: createAdminEnv(),
      pool: database.pool as any,
    });

    try {
      const response = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('用户名或密码错误');
    } finally {
      await database.close();
    }
  });

  it('应支持登录后修改密码，并使用新密码重新登录', async () => {
    const database = await createTestDatabase();
    const app = createApp(createMockClient() as any, {
      env: createAdminEnv(),
      pool: database.pool as any,
    });

    try {
      const loginResponse = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'change-me',
      });
      const cookie = loginResponse.headers['set-cookie']?.[0];
      expect(cookie).toBeTruthy();

      const changeResponse = await request(app)
        .post('/api/admin/auth/change-password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'change-me',
          newPassword: 'new-password-123',
          confirmPassword: 'new-password-123',
        });

      expect(changeResponse.status).toBe(200);
      expect(changeResponse.body).toEqual(
        expect.objectContaining({
          ok: true,
          message: '管理员密码已更新',
        }),
      );

      const oldPasswordResponse = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'change-me',
      });
      expect(oldPasswordResponse.status).toBe(401);

      const newPasswordResponse = await request(app).post('/api/admin/auth/login').send({
        username: 'admin',
        password: 'new-password-123',
      });
      expect(newPasswordResponse.status).toBe(200);
    } finally {
      await database.close();
    }
  });
});
