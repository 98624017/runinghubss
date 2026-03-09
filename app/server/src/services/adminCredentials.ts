import type { Pool } from 'pg';

import { badRequest } from '../errors.js';
import { createAdminRepository } from '../repositories/adminRepository.js';
import { hashPassword, verifyPassword } from './passwords.js';

const MIN_PASSWORD_LENGTH = 8;

export function validateAdminPassword(nextPassword: string) {
  const normalizedPassword = String(nextPassword || '').trim();

  if (!normalizedPassword) {
    throw badRequest('新密码不能为空');
  }

  if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`新密码至少 ${MIN_PASSWORD_LENGTH} 位`);
  }

  return normalizedPassword;
}

export async function changeAdminPassword(
  pool: Pool,
  input: { username: string; currentPassword: string; nextPassword: string },
) {
  const repository = createAdminRepository(pool);
  const admin = await repository.findByUsername(input.username);

  if (!admin) {
    throw badRequest('管理员账号不存在');
  }

  const isCurrentPasswordValid = await verifyPassword(input.currentPassword, admin.passwordHash);
  if (!isCurrentPasswordValid) {
    throw badRequest('当前密码错误');
  }

  const nextPassword = validateAdminPassword(input.nextPassword);
  const nextPasswordHash = await hashPassword(nextPassword);
  await repository.updatePasswordHash(admin.id, nextPasswordHash);

  return {
    id: admin.id,
    username: admin.username,
  };
}

export async function resetAdminPassword(
  pool: Pool,
  input: { username: string; nextPassword: string },
) {
  const repository = createAdminRepository(pool);
  const nextPassword = validateAdminPassword(input.nextPassword);
  const nextPasswordHash = await hashPassword(nextPassword);
  const existingAdmin = await repository.findByUsername(input.username);

  if (existingAdmin) {
    await repository.updatePasswordHash(existingAdmin.id, nextPasswordHash);
    return {
      username: existingAdmin.username,
      action: 'updated' as const,
    };
  }

  await repository.findOrCreateDefaultAdmin({
    username: input.username,
    passwordHash: nextPasswordHash,
  });

  return {
    username: input.username,
    action: 'created' as const,
  };
}
