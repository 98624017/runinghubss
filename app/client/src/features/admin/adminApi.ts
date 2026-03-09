import { buildApiUrl } from '../../apiBase';
import { DEFAULT_SITE_CONFIG } from '../site/siteApi';
import type {
  AdminApp,
  AdminAppEditorValue,
  AdminAppSchema,
  AdminMultiplierRecord,
  AdminSession,
  AdminTaskEvent,
  AdminTaskRecord,
  AdminSchemaEditorValue,
  AppFieldDefinition,
  AppLayoutSchema,
  AppResultSchema,
  SiteConfig,
} from '../../types';

type LoginAdminInput = {
  username: string;
  password: string;
};

type ChangeAdminPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PlainAdminAppInput = {
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

type UpdateAdminAppInput = Partial<AdminAppEditorValue> & {
  timeoutSeconds?: number;
  tags?: string[];
  usageTips?: string[];
  resultTips?: string[];
  coverImageUrl?: string | null;
};

type FetchAdminTasksInput = {
  taskNo?: string;
  upstreamTaskId?: string;
  apiKeyHash?: string;
  appSlug?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

type SaveAppSchemaInput =
  | AdminSchemaEditorValue
  | {
      schemaVersion: number;
      timeoutSeconds?: number;
      layoutSchema: AppLayoutSchema;
      fields: AppFieldDefinition[];
      resultSchema: AppResultSchema;
      isPublished: boolean;
    };

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function normalizeFieldArray(value: unknown): AppFieldDefinition[] {
  return Array.isArray((value as { fields?: unknown })?.fields)
    ? (((value as { fields?: unknown[] }).fields ?? []) as unknown[]).map((field) => ({
        key: String((field as { key?: unknown }).key ?? ''),
        label: String((field as { label?: unknown }).label ?? ''),
        type: ((field as { type?: unknown }).type as AppFieldDefinition['type']) ?? 'text',
        description: String((field as { description?: unknown }).description ?? ''),
        required: Boolean((field as { required?: unknown }).required),
        defaultValue:
          typeof (field as { defaultValue?: unknown }).defaultValue === 'boolean'
            ? Boolean((field as { defaultValue?: unknown }).defaultValue)
            : typeof (field as { defaultValue?: unknown }).defaultValue === 'string'
              ? String((field as { defaultValue?: unknown }).defaultValue)
              : undefined,
        accept:
          typeof (field as { accept?: unknown }).accept === 'string'
            ? String((field as { accept?: unknown }).accept)
            : undefined,
        presets: normalizeStringArray((field as { presets?: unknown }).presets),
        group:
          typeof (field as { group?: unknown }).group === 'string'
            ? String((field as { group?: unknown }).group)
            : undefined,
        sectionKey:
          typeof (field as { sectionKey?: unknown }).sectionKey === 'string'
            ? String((field as { sectionKey?: unknown }).sectionKey)
            : undefined,
        control:
          (field as { control?: unknown }).control === 'input' ||
          (field as { control?: unknown }).control === 'textarea'
            ? ((field as { control?: 'input' | 'textarea' }).control ?? undefined)
            : undefined,
        nodeId:
          typeof (field as { nodeId?: unknown }).nodeId === 'string'
            ? String((field as { nodeId?: unknown }).nodeId)
            : undefined,
        fieldName:
          typeof (field as { fieldName?: unknown }).fieldName === 'string'
            ? String((field as { fieldName?: unknown }).fieldName)
            : undefined,
        multiline:
          typeof (field as { multiline?: unknown }).multiline === 'boolean'
            ? Boolean((field as { multiline?: unknown }).multiline)
            : undefined,
        placeholder:
          typeof (field as { placeholder?: unknown }).placeholder === 'string'
            ? String((field as { placeholder?: unknown }).placeholder)
            : undefined,
        rows:
          typeof (field as { rows?: unknown }).rows === 'number'
            ? Number((field as { rows?: unknown }).rows)
            : undefined,
        sortOrder:
          typeof (field as { sortOrder?: unknown }).sortOrder === 'number'
            ? Number((field as { sortOrder?: unknown }).sortOrder)
            : undefined,
      }))
    : [];
}

function normalizeLayoutSchema(value: unknown): AppLayoutSchema {
  if (!value || typeof value !== 'object') {
    return { sections: [] };
  }
  const sections = Array.isArray((value as { sections?: unknown }).sections)
    ? ((value as { sections?: unknown[] }).sections ?? []).map((section) => ({
        key: String((section as { key?: unknown }).key ?? ''),
        title: String((section as { title?: unknown }).title ?? ''),
        description:
          typeof (section as { description?: unknown }).description === 'string'
            ? String((section as { description?: unknown }).description)
            : undefined,
        sortOrder:
          typeof (section as { sortOrder?: unknown }).sortOrder === 'number'
            ? Number((section as { sortOrder?: unknown }).sortOrder)
            : undefined,
      }))
    : [];
  return { sections };
}

function normalizeResultSchema(value: unknown): AppResultSchema {
  if (!value || typeof value !== 'object') {
    return { sections: [] };
  }
  const sections = Array.isArray((value as { sections?: unknown }).sections)
    ? ((value as { sections?: unknown[] }).sections ?? []).map((section) => ({
        key: String((section as { key?: unknown }).key ?? ''),
        title: String((section as { title?: unknown }).title ?? ''),
        description:
          typeof (section as { description?: unknown }).description === 'string'
            ? String((section as { description?: unknown }).description)
            : undefined,
        tips: normalizeStringArray((section as { tips?: unknown }).tips),
        sortOrder:
          typeof (section as { sortOrder?: unknown }).sortOrder === 'number'
            ? Number((section as { sortOrder?: unknown }).sortOrder)
            : undefined,
      }))
    : [];
  return { sections };
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isEditorValueInput(
  input: (AdminAppEditorValue & { timeoutSeconds: number }) | PlainAdminAppInput,
): input is AdminAppEditorValue & { timeoutSeconds: number } {
  return 'tagsText' in input;
}

function normalizeAdminAppInput(
  input: (AdminAppEditorValue & { timeoutSeconds: number }) | PlainAdminAppInput,
): PlainAdminAppInput {
  if (!isEditorValueInput(input)) {
    return {
      ...input,
      coverImageUrl: input.coverImageUrl || null,
    };
  }

  return {
    slug: input.slug,
    displayName: input.displayName,
    subtitle: input.subtitle,
    description: input.description,
    coverImageUrl: input.coverImageUrl || null,
    tags: splitLines(input.tagsText),
    sortOrder: input.sortOrder,
    isEnabled: input.isEnabled,
    usageTips: splitLines(input.usageTipsText),
    resultTips: splitLines(input.resultTipsText),
    upstreamAppId: input.upstreamAppId,
    instanceType: input.instanceType,
    usePersonalQueue: input.usePersonalQueue,
    pollIntervalMs: input.pollIntervalMs,
    maxPollAttempts: input.maxPollAttempts,
    timeoutSeconds: input.timeoutSeconds,
    maxConcurrencyPerKey: input.maxConcurrencyPerKey,
  };
}

function normalizeSchemaInput(input: SaveAppSchemaInput): AdminSchemaEditorValue {
  if ('fieldSchema' in input) {
    return input;
  }

  return {
    schemaVersion: input.schemaVersion,
    timeoutSeconds: input.timeoutSeconds ?? 180,
    isPublished: input.isPublished,
    layoutSchema: input.layoutSchema,
    fieldSchema: {
      fields: input.fields,
    },
    resultSchema: input.resultSchema,
  };
}

function mapAdminSchema(raw: Record<string, unknown>): AdminAppSchema {
  return {
    id: Number(raw.id ?? 0),
    appId: Number(raw.appId ?? 0),
    schemaVersion: Number(raw.schemaVersion ?? 1),
    layoutSchema: normalizeLayoutSchema(raw.layoutSchema),
    fieldSchema: {
      fields: normalizeFieldArray(raw.fieldSchema),
    },
    resultSchema: normalizeResultSchema(raw.resultSchema),
    isPublished: Boolean(raw.isPublished),
  };
}

function mapAdminApp(raw: Record<string, unknown>): AdminApp {
  return {
    id: Number(raw.id ?? 0),
    slug: String(raw.slug ?? ''),
    displayName: String(raw.displayName ?? ''),
    subtitle: String(raw.subtitle ?? ''),
    description: String(raw.description ?? ''),
    coverImageUrl: raw.coverImageUrl ? String(raw.coverImageUrl) : null,
    tags: normalizeStringArray(raw.tags),
    sortOrder: Number(raw.sortOrder ?? 0),
    isEnabled: Boolean(raw.isEnabled),
    usageTips: normalizeStringArray(raw.usageTips),
    resultTips: normalizeStringArray(raw.resultTips),
    upstreamAppId: String(raw.upstreamAppId ?? ''),
    instanceType: String(raw.instanceType ?? 'default'),
    usePersonalQueue: Boolean(raw.usePersonalQueue),
    pollIntervalMs: Number(raw.pollIntervalMs ?? 3000),
    maxPollAttempts: Number(raw.maxPollAttempts ?? 20),
    timeoutSeconds: Number(raw.timeoutSeconds ?? 180),
    maxConcurrencyPerKey: Number(raw.maxConcurrencyPerKey ?? 1),
    publishedSchema:
      raw.publishedSchema && typeof raw.publishedSchema === 'object'
        ? mapAdminSchema(raw.publishedSchema as Record<string, unknown>)
        : null,
  };
}

function mapAdminTaskEvent(raw: Record<string, unknown>): AdminTaskEvent {
  return {
    id: Number(raw.id ?? 0),
    eventType: String(raw.eventType ?? ''),
    eventPayload:
      raw.eventPayload && typeof raw.eventPayload === 'object'
        ? (raw.eventPayload as Record<string, unknown>)
        : {},
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt.trim() ? String(raw.createdAt) : null,
  };
}

function mapAdminTask(raw: Record<string, unknown>): AdminTaskRecord {
  return {
    id: Number(raw.id ?? 0),
    taskNo: String(raw.taskNo ?? ''),
    appId: Number(raw.appId ?? 0),
    appSlug: String(raw.appSlug ?? ''),
    displayName: String(raw.displayName ?? ''),
    apiKeyArchiveId: Number(raw.apiKeyArchiveId ?? 0),
    apiKeyHash: String(raw.apiKeyHash ?? ''),
    apiKeyMasked:
      typeof raw.apiKeyMasked === 'string' && raw.apiKeyMasked.trim()
        ? String(raw.apiKeyMasked)
        : undefined,
    status: String(raw.status ?? ''),
    source: String(raw.source ?? ''),
    upstreamTaskId:
      typeof raw.upstreamTaskId === 'string' && raw.upstreamTaskId.trim()
        ? String(raw.upstreamTaskId)
        : null,
    upstreamStatus:
      typeof raw.upstreamStatus === 'string' && raw.upstreamStatus.trim()
        ? String(raw.upstreamStatus)
        : null,
    inputSnapshot:
      raw.inputSnapshot && typeof raw.inputSnapshot === 'object'
        ? (raw.inputSnapshot as Record<string, unknown>)
        : {},
    normalizedParams:
      raw.normalizedParams && typeof raw.normalizedParams === 'object'
        ? (raw.normalizedParams as Record<string, unknown>)
        : {},
    resultSnapshot:
      raw.resultSnapshot && typeof raw.resultSnapshot === 'object'
        ? (raw.resultSnapshot as Record<string, unknown>)
        : null,
    errorCode:
      typeof raw.errorCode === 'string' && raw.errorCode.trim() ? String(raw.errorCode) : null,
    errorMessage:
      typeof raw.errorMessage === 'string' && raw.errorMessage.trim()
        ? String(raw.errorMessage)
        : null,
    submittedAt:
      typeof raw.submittedAt === 'string' && raw.submittedAt.trim() ? String(raw.submittedAt) : null,
    startedAt:
      typeof raw.startedAt === 'string' && raw.startedAt.trim() ? String(raw.startedAt) : null,
    finishedAt:
      typeof raw.finishedAt === 'string' && raw.finishedAt.trim() ? String(raw.finishedAt) : null,
    events: Array.isArray(raw.events)
      ? raw.events.map((event) => mapAdminTaskEvent(event as Record<string, unknown>))
      : [],
  };
}

function mapAdminMultiplier(raw: Record<string, unknown>): AdminMultiplierRecord {
  return {
    id: Number(raw.id ?? 0),
    apiKeyHash: String(raw.apiKeyHash ?? ''),
    apiKeyMasked: String(raw.apiKeyMasked ?? ''),
    displayMultiplier:
      typeof raw.displayMultiplier === 'number' ? Number(raw.displayMultiplier) : null,
    lastCheckedBalance:
      typeof raw.lastCheckedBalance === 'string' && raw.lastCheckedBalance.trim()
        ? String(raw.lastCheckedBalance)
        : null,
    lastCheckedDisplayBalance:
      typeof raw.lastCheckedDisplayBalance === 'string' && raw.lastCheckedDisplayBalance.trim()
        ? String(raw.lastCheckedDisplayBalance)
        : null,
    lastCheckedAt:
      typeof raw.lastCheckedAt === 'string' && raw.lastCheckedAt.trim()
        ? String(raw.lastCheckedAt)
        : null,
    status: String(raw.status ?? ''),
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt.trim() ? String(raw.createdAt) : null,
    updatedAt:
      typeof raw.updatedAt === 'string' && raw.updatedAt.trim() ? String(raw.updatedAt) : null,
  };
}

function readString(value: unknown, fallbackValue: string) {
  return typeof value === 'string' && value.trim() ? value : fallbackValue;
}

function readStringArray(value: unknown, fallbackValue: string[]) {
  const items = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter((item) => item.length > 0)
    : [];
  return items.length > 0 ? items : fallbackValue;
}

function readHighlightArray(
  value: unknown,
  fallbackValue: SiteConfig['solutionHighlights'],
): SiteConfig['solutionHighlights'] {
  const items = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const title = readString((item as { title?: unknown }).title, '');
          const description = readString((item as { description?: unknown }).description, '');
          const tag = readString((item as { tag?: unknown }).tag, '');
          if (!title || !description) {
            return null;
          }

          return {
            title,
            description,
            ...(tag ? { tag } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  return items.length > 0 ? items : fallbackValue;
}

function readReferenceGallery(
  value: unknown,
  fallbackValue: SiteConfig['referenceGallery'],
): SiteConfig['referenceGallery'] {
  const items = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const title = readString((item as { title?: unknown }).title, '');
          const description = readString((item as { description?: unknown }).description, '');
          const imageUrl = readString((item as { imageUrl?: unknown }).imageUrl, '');
          const badge = readString((item as { badge?: unknown }).badge, '');
          if (!title || !description || !imageUrl) {
            return null;
          }

          return {
            title,
            description,
            imageUrl,
            ...(badge ? { badge } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  return items.length > 0 ? items : fallbackValue;
}

function mapSiteConfig(raw: unknown): SiteConfig {
  const site = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return {
    brandName: readString(site.brandName, DEFAULT_SITE_CONFIG.brandName),
    heroTitle: readString(site.heroTitle, DEFAULT_SITE_CONFIG.heroTitle),
    heroSubtitle: readString(site.heroSubtitle, DEFAULT_SITE_CONFIG.heroSubtitle),
    defaultDisplayMultiplier: Number(
      site.defaultDisplayMultiplier ?? DEFAULT_SITE_CONFIG.defaultDisplayMultiplier,
    ),
    resultLinkNotice: readString(site.resultLinkNotice, DEFAULT_SITE_CONFIG.resultLinkNotice),
    customerSummaryTitle: readString(
      site.customerSummaryTitle,
      DEFAULT_SITE_CONFIG.customerSummaryTitle,
    ),
    customerSummaryText: readString(
      site.customerSummaryText,
      DEFAULT_SITE_CONFIG.customerSummaryText,
    ),
    targetAudienceTitle: readString(
      site.targetAudienceTitle,
      DEFAULT_SITE_CONFIG.targetAudienceTitle,
    ),
    targetAudience: readStringArray(site.targetAudience, DEFAULT_SITE_CONFIG.targetAudience),
    solutionHighlightsTitle: readString(
      site.solutionHighlightsTitle,
      DEFAULT_SITE_CONFIG.solutionHighlightsTitle,
    ),
    solutionHighlights: readHighlightArray(
      site.solutionHighlights,
      DEFAULT_SITE_CONFIG.solutionHighlights,
    ),
    workflowTitle: readString(site.workflowTitle, DEFAULT_SITE_CONFIG.workflowTitle),
    workflowSteps: readStringArray(site.workflowSteps, DEFAULT_SITE_CONFIG.workflowSteps),
    referenceGalleryTitle: readString(
      site.referenceGalleryTitle,
      DEFAULT_SITE_CONFIG.referenceGalleryTitle,
    ),
    referenceGallery: readReferenceGallery(
      site.referenceGallery,
      DEFAULT_SITE_CONFIG.referenceGallery,
    ),
  };
}

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? '请求失败');
  }
  return payload;
}

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(buildApiUrl(path), {
    credentials: 'include',
    ...init,
  });
  return readJson(response);
}

export async function loginAdmin(input: LoginAdminInput): Promise<AdminSession> {
  const payload = await requestJson('/api/admin/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return {
    id: Number(payload?.admin?.id ?? 0),
    username: String(payload?.admin?.username ?? ''),
    lastLoginAt:
      typeof payload?.admin?.lastLoginAt === 'string' && payload.admin.lastLoginAt.trim()
        ? String(payload.admin.lastLoginAt)
        : null,
  };
}

export async function logoutAdmin() {
  await requestJson('/api/admin/auth/logout', {
    method: 'POST',
  });
}

export async function fetchAdminMe(): Promise<AdminSession> {
  const payload = await requestJson('/api/admin/auth/me');
  return {
    id: Number(payload?.admin?.id ?? 0),
    username: String(payload?.admin?.username ?? ''),
    lastLoginAt:
      typeof payload?.admin?.lastLoginAt === 'string' && payload.admin.lastLoginAt.trim()
        ? String(payload.admin.lastLoginAt)
        : null,
  };
}

export async function changeAdminPassword(input: ChangeAdminPasswordInput) {
  await requestJson('/api/admin/auth/change-password', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function fetchAdminSiteConfig(): Promise<SiteConfig> {
  const payload = await requestJson('/api/admin/site');
  return mapSiteConfig(payload?.site);
}

export async function updateAdminSiteConfig(input: SiteConfig): Promise<SiteConfig> {
  const payload = await requestJson('/api/admin/site', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return mapSiteConfig(payload?.site);
}

export async function uploadAdminSiteAsset(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const payload = await requestJson('/api/admin/site/assets', {
    method: 'POST',
    body: formData,
  });

  return {
    fileName: readString(payload?.asset?.fileName, file.name),
    url: readString(payload?.asset?.url, ''),
  };
}

export async function fetchAdminApps(): Promise<AdminApp[]> {
  const payload = await requestJson('/api/admin/apps');
  if (!Array.isArray(payload?.apps)) {
    return [];
  }
  return payload.apps.map((app: Record<string, unknown>) => mapAdminApp(app));
}

export const listAdminApps = fetchAdminApps;


export async function createAdminApp(
  input: (AdminAppEditorValue & { timeoutSeconds: number }) | PlainAdminAppInput,
) {
  const normalizedInput = normalizeAdminAppInput(input);
  const payload = await requestJson('/api/admin/apps', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(normalizedInput),
  });
  return mapAdminApp(payload.app as Record<string, unknown>);
}

export async function updateAdminApp(appId: number, input: UpdateAdminAppInput) {
  const payload = await requestJson(`/api/admin/apps/${appId}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ...input,
      ...(typeof input.tagsText === 'string' ? { tags: splitLines(input.tagsText) } : {}),
      ...(Array.isArray(input.tags) ? { tags: input.tags } : {}),
      ...(typeof input.usageTipsText === 'string'
        ? { usageTips: splitLines(input.usageTipsText) }
        : {}),
      ...(Array.isArray(input.usageTips) ? { usageTips: input.usageTips } : {}),
      ...(typeof input.resultTipsText === 'string'
        ? { resultTips: splitLines(input.resultTipsText) }
        : {}),
      ...(Array.isArray(input.resultTips) ? { resultTips: input.resultTips } : {}),
      ...(typeof input.coverImageUrl === 'string' ? { coverImageUrl: input.coverImageUrl || null } : {}),
    }),
  });
  return mapAdminApp(payload.app as Record<string, unknown>);
}

export async function publishAdminSchema(appId: number, input: SaveAppSchemaInput) {
  const normalizedInput = normalizeSchemaInput(input);
  const payload = await requestJson(`/api/admin/apps/${appId}/schema`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      schemaVersion: normalizedInput.schemaVersion,
      timeoutSeconds: normalizedInput.timeoutSeconds,
      layoutSchema: normalizedInput.layoutSchema,
      fieldSchema: normalizedInput.fieldSchema,
      resultSchema: normalizedInput.resultSchema,
      isPublished: normalizedInput.isPublished,
    }),
  });
  const schema = mapAdminSchema(payload.schema as Record<string, unknown>);
  return {
    ...schema,
    timeoutSeconds: normalizedInput.timeoutSeconds,
  } as AdminAppSchema & { timeoutSeconds: number };
}

export const saveAppSchema = publishAdminSchema;
export const searchAdminTasks = fetchAdminTasks;

export async function fetchAdminTasks(input: FetchAdminTasksInput = {}): Promise<AdminTaskRecord[]> {
  const searchParams = new URLSearchParams();
  if (input.taskNo) {
    searchParams.set('taskNo', input.taskNo);
  }
  if (input.upstreamTaskId) {
    searchParams.set('upstreamTaskId', input.upstreamTaskId);
  }
  if (input.apiKeyHash) {
    searchParams.set('apiKeyHash', input.apiKeyHash);
  }
  if (input.appSlug) {
    searchParams.set('appSlug', input.appSlug);
  }
  if (input.status) {
    searchParams.set('status', input.status);
  }
  if (input.dateFrom) {
    searchParams.set('dateFrom', input.dateFrom);
  }
  if (input.dateTo) {
    searchParams.set('dateTo', input.dateTo);
  }
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const payload = await requestJson(`/api/admin/tasks${suffix}`);
  if (!Array.isArray(payload?.tasks)) {
    return [];
  }
  return payload.tasks.map((task: Record<string, unknown>) => mapAdminTask(task));
}

export async function listAdminMultipliers(): Promise<AdminMultiplierRecord[]> {
  const payload = await requestJson('/api/admin/multipliers');
  if (!Array.isArray(payload?.archives)) {
    return [];
  }

  return payload.archives.map((archive: Record<string, unknown>) => mapAdminMultiplier(archive));
}

export async function updateAdminMultiplier(
  archiveId: number,
  displayMultiplier: number,
): Promise<AdminMultiplierRecord> {
  const payload = await requestJson(`/api/admin/multipliers/${archiveId}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ displayMultiplier }),
  });

  return mapAdminMultiplier((payload?.archive ?? {}) as Record<string, unknown>);
}
