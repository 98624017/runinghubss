create table if not exists admin_users (
  id bigserial primary key,
  username text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_apps (
  id bigserial primary key,
  slug text not null unique,
  display_name text not null,
  subtitle text not null,
  description text not null,
  cover_image_url text,
  tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  usage_tips jsonb not null default '[]'::jsonb,
  result_tips jsonb not null default '[]'::jsonb,
  upstream_app_id text not null,
  instance_type text not null default 'default',
  use_personal_queue boolean not null default false,
  poll_interval_ms integer not null default 3000,
  max_poll_attempts integer not null default 20,
  timeout_seconds integer not null default 180,
  max_concurrency_per_key integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_app_schemas (
  id bigserial primary key,
  app_id bigint not null references ai_apps(id) on delete cascade,
  schema_version integer not null,
  layout_schema_json jsonb not null default '{}'::jsonb,
  field_schema_json jsonb not null default '{}'::jsonb,
  result_schema_json jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ai_app_schemas_app_id_schema_version_idx
  on ai_app_schemas(app_id, schema_version);

create table if not exists api_key_archives (
  id bigserial primary key,
  api_key_hash text not null unique,
  api_key_masked text not null,
  display_multiplier numeric(10, 4),
  last_checked_balance text,
  last_checked_display_balance text,
  last_checked_at timestamptz,
  status text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id bigserial primary key,
  task_no text not null unique,
  app_id bigint not null references ai_apps(id) on delete restrict,
  api_key_archive_id bigint not null references api_key_archives(id) on delete restrict,
  status text not null,
  source text not null,
  input_snapshot_json jsonb not null default '{}'::jsonb,
  normalized_params_json jsonb not null default '{}'::jsonb,
  upstream_task_id text,
  upstream_status text,
  active_api_key_ciphertext text,
  result_snapshot_json jsonb,
  error_code text,
  error_message text,
  submitted_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_events (
  id bigserial primary key,
  task_id bigint not null references tasks(id) on delete cascade,
  event_type text not null,
  event_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists task_events_task_id_idx on task_events(task_id);

create table if not exists system_configs (
  id bigserial primary key,
  config_key text not null unique,
  config_value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
