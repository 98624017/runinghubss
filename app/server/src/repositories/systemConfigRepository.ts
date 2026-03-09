import type { Pool } from 'pg';

function mapSystemConfig(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    configKey: String(row.config_key),
    configValue: (row.config_value_json || {}) as Record<string, unknown>,
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
  };
}

export function createSystemConfigRepository(pool: Pool) {
  return {
    async upsertConfig(input: { key: string; value: Record<string, unknown> }) {
      const result = await pool.query(
        `
          insert into system_configs (config_key, config_value_json)
          values ($1, $2::jsonb)
          on conflict (config_key)
          do update set
            config_value_json = excluded.config_value_json,
            updated_at = now()
          returning *
        `,
        [input.key, JSON.stringify(input.value)],
      );

      return mapSystemConfig(result.rows[0]);
    },

    async findConfig(key: string) {
      const result = await pool.query(
        `
          select *
          from system_configs
          where config_key = $1
          limit 1
        `,
        [key],
      );

      return result.rows[0] ? mapSystemConfig(result.rows[0]) : null;
    },
  };
}

export async function upsertSystemConfig(
  pool: Pool,
  input: { configKey: string; configValue: Record<string, unknown> },
) {
  return createSystemConfigRepository(pool).upsertConfig({
    key: input.configKey,
    value: input.configValue,
  });
}
