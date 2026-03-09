import type { Pool } from 'pg';

type CreateAppInput = {
  slug: string;
  displayName: string;
  subtitle: string;
  description: string;
  coverImageUrl: string | null;
  tags: string[];
  sortOrder: number;
  isEnabled: boolean;
  usageTips: string[];
  resultTips: string[];
  upstreamAppId: string;
  instanceType: string;
  usePersonalQueue: boolean;
  pollIntervalMs: number;
  maxPollAttempts: number;
  timeoutSeconds: number;
  maxConcurrencyPerKey: number;
};

type SaveSchemaInput = {
  appId: number;
  schemaVersion: number;
  layoutSchema: Record<string, unknown>;
  fieldSchema: Record<string, unknown>;
  resultSchema: Record<string, unknown>;
  isPublished: boolean;
};

function mapApp(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    subtitle: String(row.subtitle),
    description: String(row.description),
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    sortOrder: Number(row.sort_order),
    isEnabled: Boolean(row.is_enabled),
    usageTips: Array.isArray(row.usage_tips) ? row.usage_tips.map(String) : [],
    resultTips: Array.isArray(row.result_tips) ? row.result_tips.map(String) : [],
    upstreamAppId: String(row.upstream_app_id),
    instanceType: String(row.instance_type),
    usePersonalQueue: Boolean(row.use_personal_queue),
    pollIntervalMs: Number(row.poll_interval_ms),
    maxPollAttempts: Number(row.max_poll_attempts),
    timeoutSeconds: Number(row.timeout_seconds),
    maxConcurrencyPerKey: Number(row.max_concurrency_per_key),
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
  };
}

function mapSchema(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    appId: Number(row.app_id),
    schemaVersion: Number(row.schema_version),
    layoutSchema: (row.layout_schema_json || {}) as Record<string, unknown>,
    fieldSchema: (row.field_schema_json || {}) as Record<string, unknown>,
    resultSchema: (row.result_schema_json || {}) as Record<string, unknown>,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
  };
}

export function createAppRepository(pool: Pool) {
  return {
    async findAppById(appId: number) {
      const result = await pool.query(
        `
          select *
          from ai_apps
          where id = $1
          limit 1
        `,
        [appId],
      );

      return result.rows[0] ? mapApp(result.rows[0]) : null;
    },

    async findAppByUpstreamAppId(upstreamAppId: string) {
      const result = await pool.query(
        `
          select *
          from ai_apps
          where upstream_app_id = $1
          limit 1
        `,
        [upstreamAppId],
      );

      return result.rows[0] ? mapApp(result.rows[0]) : null;
    },

    async listApps() {
      const appsResult = await pool.query(
        `
          select *
          from ai_apps
          order by sort_order asc, id asc
        `,
      );

      const schemaResult = await pool.query(
        `
          select *
          from ai_app_schemas
          where is_published = true
          order by app_id asc, schema_version desc, id desc
        `,
      );

      const schemaByAppId = new Map<number, ReturnType<typeof mapSchema>>();
      for (const row of schemaResult.rows) {
        const schema = mapSchema(row);
        if (!schemaByAppId.has(schema.appId)) {
          schemaByAppId.set(schema.appId, schema);
        }
      }

      return appsResult.rows.map((row) => {
        const app = mapApp(row);
        return {
          ...app,
          publishedSchema: schemaByAppId.get(app.id) ?? null,
        };
      });
    },

    async createApp(input: CreateAppInput) {
      const result = await pool.query(
        `
          insert into ai_apps (
            slug, display_name, subtitle, description, cover_image_url, tags, sort_order, is_enabled,
            usage_tips, result_tips, upstream_app_id, instance_type, use_personal_queue, poll_interval_ms,
            max_poll_attempts, timeout_seconds, max_concurrency_per_key
          )
          values (
            $1, $2, $3, $4, $5, $6::jsonb, $7, $8,
            $9::jsonb, $10::jsonb, $11, $12, $13, $14,
            $15, $16, $17
          )
          returning *
        `,
        [
          input.slug,
          input.displayName,
          input.subtitle,
          input.description,
          input.coverImageUrl,
          JSON.stringify(input.tags),
          input.sortOrder,
          input.isEnabled,
          JSON.stringify(input.usageTips),
          JSON.stringify(input.resultTips),
          input.upstreamAppId,
          input.instanceType,
          input.usePersonalQueue,
          input.pollIntervalMs,
          input.maxPollAttempts,
          input.timeoutSeconds,
          input.maxConcurrencyPerKey,
        ],
      );

      return mapApp(result.rows[0]);
    },

    async updateApp(
      appId: number,
      input: {
        slug?: string;
        displayName?: string;
        subtitle?: string;
        description?: string;
        coverImageUrl?: string | null;
        tags?: string[];
        sortOrder?: number;
        usageTips?: string[];
        resultTips?: string[];
        upstreamAppId?: string;
        instanceType?: string;
        usePersonalQueue?: boolean;
        timeoutSeconds?: number;
        maxPollAttempts?: number;
        pollIntervalMs?: number;
        maxConcurrencyPerKey?: number;
        isEnabled?: boolean;
      },
    ) {
      const existing = await pool.query(
        `
          select *
          from ai_apps
          where id = $1
          limit 1
        `,
        [appId],
      );

      if (!existing.rows[0]) {
        throw new Error(`应用不存在：${appId}`);
      }

      const current = existing.rows[0];
      const result = await pool.query(
        `
          update ai_apps
             set slug = $2,
                 display_name = $3,
                 subtitle = $4,
                 description = $5,
                 cover_image_url = $6,
                 tags = $7::jsonb,
                 sort_order = $8,
                 usage_tips = $9::jsonb,
                 result_tips = $10::jsonb,
                 upstream_app_id = $11,
                 instance_type = $12,
                 use_personal_queue = $13,
                 timeout_seconds = $14,
                 max_poll_attempts = $15,
                 poll_interval_ms = $16,
                 max_concurrency_per_key = $17,
                 is_enabled = $18,
                 updated_at = now()
           where id = $1
         returning *
        `,
        [
          appId,
          input.slug ?? String(current.slug),
          input.displayName ?? String(current.display_name),
          input.subtitle ?? String(current.subtitle),
          input.description ?? String(current.description),
          Object.prototype.hasOwnProperty.call(input, 'coverImageUrl')
            ? input.coverImageUrl
            : current.cover_image_url
              ? String(current.cover_image_url)
              : null,
          JSON.stringify(input.tags ?? (Array.isArray(current.tags) ? current.tags.map(String) : [])),
          input.sortOrder ?? Number(current.sort_order),
          JSON.stringify(
            input.usageTips ?? (Array.isArray(current.usage_tips) ? current.usage_tips.map(String) : []),
          ),
          JSON.stringify(
            input.resultTips ?? (Array.isArray(current.result_tips) ? current.result_tips.map(String) : []),
          ),
          input.upstreamAppId ?? String(current.upstream_app_id),
          input.instanceType ?? String(current.instance_type),
          input.usePersonalQueue ?? Boolean(current.use_personal_queue),
          input.timeoutSeconds ?? Number(current.timeout_seconds),
          input.maxPollAttempts ?? Number(current.max_poll_attempts),
          input.pollIntervalMs ?? Number(current.poll_interval_ms),
          input.maxConcurrencyPerKey ?? Number(current.max_concurrency_per_key),
          input.isEnabled ?? Boolean(current.is_enabled),
        ],
      );

      return mapApp(result.rows[0]);
    },

    async saveSchema(input: SaveSchemaInput) {
      if (input.isPublished) {
        await pool.query('update ai_app_schemas set is_published = false where app_id = $1', [input.appId]);
      }

      const result = await pool.query(
        `
          insert into ai_app_schemas (
            app_id, schema_version, layout_schema_json, field_schema_json, result_schema_json, is_published
          )
          values ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6)
          returning *
        `,
        [
          input.appId,
          input.schemaVersion,
          JSON.stringify(input.layoutSchema),
          JSON.stringify(input.fieldSchema),
          JSON.stringify(input.resultSchema),
          input.isPublished,
        ],
      );

      return mapSchema(result.rows[0]);
    },

    async getNextSchemaVersion(appId: number) {
      const result = await pool.query(
        `
          select coalesce(max(schema_version), 0) + 1 as next_schema_version
          from ai_app_schemas
          where app_id = $1
        `,
        [appId],
      );

      return Number(result.rows[0]?.next_schema_version ?? 1);
    },

    async listPublishedApps() {
      const result = await pool.query(
        `
          select
            app.*,
            schema.id as schema_id,
            schema.schema_version,
            schema.layout_schema_json,
            schema.field_schema_json,
            schema.result_schema_json,
            schema.is_published as schema_is_published,
            schema.created_at as schema_created_at,
            schema.updated_at as schema_updated_at
          from ai_apps app
          join ai_app_schemas schema
            on schema.app_id = app.id
           and schema.is_published = true
          where app.is_enabled = true
          order by app.sort_order asc, app.id asc
        `,
      );

      return result.rows.map((row) => ({
        ...mapApp(row),
        publishedSchema: {
          id: Number(row.schema_id),
          appId: Number(row.id),
          schemaVersion: Number(row.schema_version),
          layoutSchema: (row.layout_schema_json || {}) as Record<string, unknown>,
          fieldSchema: (row.field_schema_json || {}) as Record<string, unknown>,
          resultSchema: (row.result_schema_json || {}) as Record<string, unknown>,
          isPublished: Boolean(row.schema_is_published),
          createdAt:
            row.schema_created_at instanceof Date
              ? row.schema_created_at
              : new Date(String(row.schema_created_at)),
          updatedAt:
            row.schema_updated_at instanceof Date
              ? row.schema_updated_at
              : new Date(String(row.schema_updated_at)),
        },
      }));
    },
  };
}

export async function createAiApp(pool: Pool, input: CreateAppInput) {
  return createAppRepository(pool).createApp(input);
}

export async function saveAppSchema(pool: Pool, input: SaveSchemaInput) {
  return createAppRepository(pool).saveSchema(input);
}

export async function listPublishedApps(pool: Pool) {
  return createAppRepository(pool).listPublishedApps();
}
