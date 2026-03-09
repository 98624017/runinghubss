import type { Pool } from 'pg';

type AdminUserRow = {
  id: number;
  username: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapAdminUser(row: Record<string, unknown>): AdminUserRow {
  return {
    id: Number(row.id),
    username: String(row.username),
    passwordHash: String(row.password_hash),
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at instanceof Date ? row.last_login_at : row.last_login_at ? new Date(String(row.last_login_at)) : null,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
  };
}

export function createAdminRepository(pool: Pool) {
  return {
    async findOrCreateDefaultAdmin(input: { username: string; passwordHash: string }) {
      const existing = await pool.query(
        `
          select *
          from admin_users
          where username = $1
          limit 1
        `,
        [input.username],
      );

      if (existing.rowCount && existing.rows[0]) {
        return mapAdminUser(existing.rows[0]);
      }

      const inserted = await pool.query(
        `
          insert into admin_users (username, password_hash)
          values ($1, $2)
          returning *
        `,
        [input.username, input.passwordHash],
      );

      return mapAdminUser(inserted.rows[0]);
    },

    async findByUsername(username: string) {
      const result = await pool.query(
        `
          select *
          from admin_users
          where username = $1
          limit 1
        `,
        [username],
      );

      return result.rows[0] ? mapAdminUser(result.rows[0]) : null;
    },

    async updateLastLoginAt(id: number) {
      const result = await pool.query(
        `
          update admin_users
             set last_login_at = now(),
                 updated_at = now()
           where id = $1
         returning *
        `,
        [id],
      );

      return mapAdminUser(result.rows[0]);
    },

    async updatePasswordHash(id: number, passwordHash: string) {
      const result = await pool.query(
        `
          update admin_users
             set password_hash = $2,
                 updated_at = now()
           where id = $1
         returning *
        `,
        [id, passwordHash],
      );

      return result.rows[0] ? mapAdminUser(result.rows[0]) : null;
    },
  };
}

export async function findOrCreateDefaultAdmin(
  pool: Pool,
  input: { username: string; passwordHash: string },
) {
  return createAdminRepository(pool).findOrCreateDefaultAdmin(input);
}
