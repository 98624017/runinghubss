import { describe, expect, it } from 'vitest';

import { createAdminRepository } from '../repositories/adminRepository.js';
import { createTestDatabase } from '../db/testDatabase.js';
import { verifyPassword } from './passwords.js';
import { resetAdminPassword } from './adminCredentials.js';

describe('adminCredentials', () => {
  it('应支持按用户名重置管理员密码', async () => {
    const database = await createTestDatabase();

    try {
      const repository = createAdminRepository(database.pool as any);

      await repository.findOrCreateDefaultAdmin({
        username: 'admin',
        passwordHash: 'scrypt:invalid:hash',
      });

      const result = await resetAdminPassword(database.pool as any, {
        username: 'admin',
        nextPassword: 'reset-password-123',
      });

      expect(result).toEqual(
        expect.objectContaining({
          username: 'admin',
          action: 'updated',
        }),
      );

      const admin = await repository.findByUsername('admin');
      expect(admin).toBeTruthy();
      expect(await verifyPassword('reset-password-123', String(admin?.passwordHash))).toBe(true);
    } finally {
      await database.close();
    }
  });
});
