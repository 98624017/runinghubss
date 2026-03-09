import type { Pool } from 'pg';

function mapTask(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    taskNo: String(row.task_no),
    appId: Number(row.app_id),
    apiKeyArchiveId: Number(row.api_key_archive_id),
    status: String(row.status),
    source: String(row.source),
    inputSnapshot: (row.input_snapshot_json || {}) as Record<string, unknown>,
    normalizedParams: (row.normalized_params_json || {}) as Record<string, unknown>,
    upstreamTaskId: row.upstream_task_id ? String(row.upstream_task_id) : null,
    upstreamStatus: row.upstream_status ? String(row.upstream_status) : null,
    activeApiKeyCiphertext: row.active_api_key_ciphertext ? String(row.active_api_key_ciphertext) : null,
    resultSnapshot: (row.result_snapshot_json || null) as Record<string, unknown> | null,
    errorCode: row.error_code ? String(row.error_code) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    submittedAt: row.submitted_at ? new Date(String(row.submitted_at)) : null,
    startedAt: row.started_at ? new Date(String(row.started_at)) : null,
    finishedAt: row.finished_at ? new Date(String(row.finished_at)) : null,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
  };
}

function mapTaskEvent(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    taskId: Number(row.task_id),
    eventType: String(row.event_type),
    eventPayload: (row.event_payload_json || {}) as Record<string, unknown>,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
  };
}

export function createTaskRepository(pool: Pool) {
  return {
    async createTask(input: {
      taskNo: string;
      appId: number;
      apiKeyArchiveId: number;
      status: string;
      source: string;
      inputSnapshot: Record<string, unknown>;
      normalizedParams: Record<string, unknown>;
      activeApiKeyCiphertext?: string | null;
    }) {
      const result = await pool.query(
        `
          insert into tasks (
            task_no, app_id, api_key_archive_id, status, source, input_snapshot_json, normalized_params_json,
            active_api_key_ciphertext
          )
          values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
          returning *
        `,
        [
          input.taskNo,
          input.appId,
          input.apiKeyArchiveId,
          input.status,
          input.source,
          JSON.stringify(input.inputSnapshot),
          JSON.stringify(input.normalizedParams),
          input.activeApiKeyCiphertext ?? null,
        ],
      );

      return mapTask(result.rows[0]);
    },

    async updateTaskState(input: {
      taskId: number;
      status: string;
      upstreamTaskId?: string;
      upstreamStatus?: string;
      activeApiKeyCiphertext?: string | null;
      resultSnapshot?: Record<string, unknown> | null;
      errorCode?: string | null;
      errorMessage?: string | null;
    }) {
      const result = await pool.query(
        `
          update tasks
             set status = $2,
                 upstream_task_id = coalesce($3, upstream_task_id),
                 upstream_status = coalesce($4, upstream_status),
                 active_api_key_ciphertext = case
                   when $5::boolean = true then $6
                   else active_api_key_ciphertext
                 end,
                 result_snapshot_json = case
                   when $7::boolean = true then $8::jsonb
                   else result_snapshot_json
                 end,
                 error_code = case
                   when $9::boolean = true then $10
                   else error_code
                 end,
                 error_message = case
                   when $11::boolean = true then $12
                   else error_message
                 end,
                 started_at = case when $2 = 'running' and started_at is null then now() else started_at end,
                 submitted_at = case when $2 in ('submitted', 'running') and submitted_at is null then now() else submitted_at end,
                 finished_at = case when $2 in ('succeeded', 'failed', 'timeout', 'cancelled') then now() else finished_at end,
                 updated_at = now()
           where id = $1
         returning *
        `,
        [
          input.taskId,
          input.status,
          input.upstreamTaskId ?? null,
          input.upstreamStatus ?? null,
          Object.prototype.hasOwnProperty.call(input, 'activeApiKeyCiphertext'),
          input.activeApiKeyCiphertext ?? null,
          Object.prototype.hasOwnProperty.call(input, 'resultSnapshot'),
          input.resultSnapshot ? JSON.stringify(input.resultSnapshot) : null,
          Object.prototype.hasOwnProperty.call(input, 'errorCode'),
          input.errorCode ?? null,
          Object.prototype.hasOwnProperty.call(input, 'errorMessage'),
          input.errorMessage ?? null,
        ],
      );

      return mapTask(result.rows[0]);
    },

    async findTaskByTaskNo(taskNo: string) {
      const result = await pool.query(
        `
          select *
          from tasks
          where task_no = $1
          limit 1
        `,
        [taskNo],
      );

      return result.rows[0] ? mapTask(result.rows[0]) : null;
    },

    async findTaskById(taskId: number) {
      const result = await pool.query(
        `
          select *
          from tasks
          where id = $1
          limit 1
        `,
        [taskId],
      );

      return result.rows[0] ? mapTask(result.rows[0]) : null;
    },

    async updateTaskResult(input: {
      taskId: number;
      status: string;
      resultSnapshot?: Record<string, unknown>;
      errorCode?: string | null;
      errorMessage?: string | null;
    }) {
      const result = await pool.query(
        `
          update tasks
             set status = $2,
                 result_snapshot_json = case
                   when $3::boolean = true then $4::jsonb
                   else result_snapshot_json
                 end,
                 error_code = case
                   when $5::boolean = true then $6
                   else error_code
                 end,
                 error_message = case
                   when $7::boolean = true then $8
                   else error_message
                 end,
                 finished_at = case when $2 in ('succeeded', 'failed', 'timeout', 'cancelled') then now() else finished_at end,
                 updated_at = now()
           where id = $1
         returning *
        `,
        [
          input.taskId,
          input.status,
          Object.prototype.hasOwnProperty.call(input, 'resultSnapshot'),
          input.resultSnapshot ? JSON.stringify(input.resultSnapshot) : null,
          Object.prototype.hasOwnProperty.call(input, 'errorCode'),
          input.errorCode ?? null,
          Object.prototype.hasOwnProperty.call(input, 'errorMessage'),
          input.errorMessage ?? null,
        ],
      );

      return result.rows[0] ? mapTask(result.rows[0]) : null;
    },

    async listPendingTasks() {
      const result = await pool.query(
        `
          select *
          from tasks
          where status in ('queued', 'submitted', 'running')
          order by id asc
        `,
      );

      return result.rows.map(mapTask);
    },

    async appendEvent(input: {
      taskId: number;
      eventType: string;
      eventPayload: Record<string, unknown>;
    }) {
      const result = await pool.query(
        `
          insert into task_events (task_id, event_type, event_payload_json)
          values ($1, $2, $3::jsonb)
          returning *
        `,
        [input.taskId, input.eventType, JSON.stringify(input.eventPayload)],
      );

      return mapTaskEvent(result.rows[0]);
    },

    async listEvents(taskId: number) {
      const result = await pool.query(
        `
          select *
          from task_events
          where task_id = $1
          order by id asc
        `,
        [taskId],
      );

      return result.rows.map(mapTaskEvent);
    },

    async listHistoryByApiKeyHash(input: {
      apiKeyHash: string;
      appSlug?: string;
      status?: string;
    }) {
      const values: string[] = [input.apiKeyHash];
      const conditions = ['archive.api_key_hash = $1'];

      if (input.appSlug) {
        values.push(input.appSlug);
        conditions.push(`app.slug = $${values.length}`);
      }

      if (input.status) {
        values.push(input.status);
        conditions.push(`task.status = $${values.length}`);
      }

      const result = await pool.query(
        `
          select
            task.*,
            app.slug as app_slug,
            app.display_name,
            archive.api_key_hash
          from tasks task
          join ai_apps app on app.id = task.app_id
          join api_key_archives archive on archive.id = task.api_key_archive_id
          where ${conditions.join(' and ')}
          order by task.id desc
        `,
        values,
      );

      return result.rows.map((row) => ({
        ...mapTask(row),
        appSlug: String(row.app_slug),
        displayName: String(row.display_name),
        apiKeyHash: String(row.api_key_hash),
      }));
    },

    async listAdminTasks(input: {
      taskNo?: string;
      upstreamTaskId?: string;
      apiKeyHash?: string;
      appSlug?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }) {
      const values: string[] = [];
      const conditions: string[] = [];

      if (input.taskNo) {
        values.push(input.taskNo);
        conditions.push(`task.task_no = $${values.length}`);
      }

      if (input.upstreamTaskId) {
        values.push(input.upstreamTaskId);
        conditions.push(`task.upstream_task_id = $${values.length}`);
      }

      if (input.apiKeyHash) {
        values.push(input.apiKeyHash);
        conditions.push(`archive.api_key_hash = $${values.length}`);
      }

      if (input.appSlug) {
        values.push(input.appSlug);
        conditions.push(`app.slug = $${values.length}`);
      }

      if (input.status) {
        values.push(input.status);
        conditions.push(`task.status = $${values.length}`);
      }

      if (input.dateFrom) {
        values.push(input.dateFrom);
        conditions.push(`task.created_at >= $${values.length}::timestamptz`);
      }

      if (input.dateTo) {
        values.push(input.dateTo);
        conditions.push(`task.created_at <= $${values.length}::timestamptz`);
      }

      const whereClause = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
      const result = await pool.query(
        `
          select
            task.*,
            app.slug as app_slug,
            app.display_name,
            archive.api_key_hash,
            archive.api_key_masked
          from tasks task
          join ai_apps app on app.id = task.app_id
          join api_key_archives archive on archive.id = task.api_key_archive_id
          ${whereClause}
          order by task.id desc
        `,
        values,
      );

      return Promise.all(
        result.rows.map(async (row) => ({
          ...mapTask(row),
          appSlug: String(row.app_slug),
          displayName: String(row.display_name),
          apiKeyHash: String(row.api_key_hash),
          apiKeyMasked: String(row.api_key_masked),
          events: await this.listEvents(Number(row.id)),
        })),
      );
    },
  };
}

export async function createTask(
  pool: Pool,
  input: {
    taskNo: string;
    appId: number;
    apiKeyArchiveId: number;
    status: string;
    source: string;
    inputSnapshot: Record<string, unknown>;
    normalizedParams: Record<string, unknown>;
  },
) {
  return createTaskRepository(pool).createTask(input);
}

export async function appendTaskEvent(
  pool: Pool,
  input: {
    taskId: number;
    eventType: string;
    eventPayload: Record<string, unknown>;
  },
) {
  return createTaskRepository(pool).appendEvent(input);
}

export async function listTaskEvents(pool: Pool, taskId: number) {
  return createTaskRepository(pool).listEvents(taskId);
}
