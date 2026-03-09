import type { Pool } from 'pg';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';

import type { ServerEnv } from '../config/env.js';
import { badRequest } from '../errors.js';
import { createAdminRepository } from '../repositories/adminRepository.js';
import { changeAdminPassword } from '../services/adminCredentials.js';
import { createAdminSessionManager } from '../services/adminSession.js';
import { hashPassword, verifyPassword } from '../services/passwords.js';

async function ensureDefaultAdmin(pool: Pool, env: ServerEnv) {
  const repository = createAdminRepository(pool);
  const hashedPassword = await hashPassword(env.adminDefaultPassword);
  return repository.findOrCreateDefaultAdmin({
    username: env.adminDefaultUsername,
    passwordHash: hashedPassword,
  });
}

export function createAdminAuthRouter(options: { pool: Pool; env: ServerEnv }): Router {
  const router = createRouter();
  const repository = createAdminRepository(options.pool);
  const sessionManager = createAdminSessionManager({
    secret: options.env.sessionSecret,
    secure: options.env.nodeEnv === 'production',
  });

  router.post('/login', async (req: Request, res: Response) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '').trim();

    if (!username || !password) {
      throw badRequest('缺少用户名或密码');
    }

    await ensureDefaultAdmin(options.pool, options.env);

    const admin = await repository.findByUsername(username);
    const isPasswordValid = admin ? await verifyPassword(password, admin.passwordHash) : false;
    if (!admin || !isPasswordValid) {
      return res.status(401).json({ ok: false, message: '用户名或密码错误' });
    }

    await repository.updateLastLoginAt(admin.id);
    sessionManager.issue(res, { id: admin.id, username: admin.username });

    return res.json({
      ok: true,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  });

  router.post('/logout', (req: Request, res: Response) => {
    sessionManager.clear(res);
    return res.json({ ok: true });
  });

  router.post('/change-password', async (req: Request, res: Response) => {
    const session = sessionManager.read(req);
    if (!session) {
      return res.status(401).json({ ok: false, message: '未登录' });
    }

    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();
    const confirmPassword = String(req.body?.confirmPassword || '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw badRequest('请完整填写当前密码、新密码和确认密码');
    }

    if (newPassword !== confirmPassword) {
      throw badRequest('两次输入的新密码不一致');
    }

    if (currentPassword === newPassword) {
      throw badRequest('新密码不能与当前密码相同');
    }

    await changeAdminPassword(options.pool, {
      username: session.username,
      currentPassword,
      nextPassword: newPassword,
    });

    return res.json({
      ok: true,
      message: '管理员密码已更新',
    });
  });

  router.get('/me', async (req: Request, res: Response) => {
    const session = sessionManager.read(req);
    if (!session) {
      return res.status(401).json({ ok: false, message: '未登录' });
    }

    const admin = await repository.findByUsername(session.username);
    if (!admin || !admin.isActive) {
      sessionManager.clear(res);
      return res.status(401).json({ ok: false, message: '登录已失效' });
    }

    return res.json({
      ok: true,
      admin: {
        id: admin.id,
        username: admin.username,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  });

  return router;
}
