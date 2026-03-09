import type { Pool } from 'pg';

function mapArchive(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    apiKeyHash: String(row.api_key_hash),
    apiKeyMasked: String(row.api_key_masked),
    displayMultiplier: row.display_multiplier === null ? null : Number(row.display_multiplier),
    lastCheckedBalance: row.last_checked_balance ? String(row.last_checked_balance) : null,
    lastCheckedDisplayBalance: row.last_checked_display_balance ? String(row.last_checked_display_balance) : null,
    lastCheckedAt: row.last_checked_at ? new Date(String(row.last_checked_at)) : null,
    status: String(row.status),
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
  };
}

export function createApiKeyArchiveRepository(pool: Pool) {
  return {
    async listArchives() {
      const result = await pool.query(
        `
          select *
          from api_key_archives
          order by updated_at desc, id desc
        `,
      );

      return result.rows.map((row) => mapArchive(row));
    },

    async findByHash(apiKeyHash: string) {
      const result = await pool.query(
        `
          select *
          from api_key_archives
          where api_key_hash = $1
          limit 1
        `,
        [apiKeyHash],
      );

      return result.rows[0] ? mapArchive(result.rows[0]) : null;
    },

    async findOrCreateArchive(input: { apiKeyHash: string; apiKeyMasked: string }) {
      const existing = await this.findByHash(input.apiKeyHash);
      if (existing) {
        return existing;
      }

      const inserted = await pool.query(
        `
          insert into api_key_archives (api_key_hash, api_key_masked)
          values ($1, $2)
          returning *
        `,
        [input.apiKeyHash, input.apiKeyMasked],
      );

      return mapArchive(inserted.rows[0]);
    },

    async updateDisplayMultiplier(input: { archiveId: number; displayMultiplier: number }) {
      const result = await pool.query(
        `
          update api_key_archives
             set display_multiplier = $2,
                 updated_at = now()
           where id = $1
         returning *
        `,
        [input.archiveId, input.displayMultiplier],
      );

      return result.rows[0] ? mapArchive(result.rows[0]) : null;
    },

    async updateBalanceSnapshot(input: {
      archiveId: number;
      displayMultiplier: number;
      lastCheckedBalance: string;
      lastCheckedDisplayBalance: string;
      status: string;
    }) {
      const result = await pool.query(
        `
          update api_key_archives
             set display_multiplier = $2,
                 last_checked_balance = $3,
                 last_checked_display_balance = $4,
                 last_checked_at = now(),
                 status = $5,
                 updated_at = now()
           where id = $1
         returning *
        `,
        [
          input.archiveId,
          input.displayMultiplier,
          input.lastCheckedBalance,
          input.lastCheckedDisplayBalance,
          input.status,
        ],
      );

      return mapArchive(result.rows[0]);
    },
  };
}
