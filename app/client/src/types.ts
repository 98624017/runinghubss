export type SupportedAppId = string;

export type AppFieldType = 'file' | 'boolean' | 'text';

export type AppFieldDefinition = {
  key: string;
  label: string;
  type: AppFieldType;
  description: string;
  required: boolean;
  defaultValue?: string | boolean;
  accept?: string;
  presets?: string[];
  group?: string;
  sectionKey?: string;
  control?: 'textarea' | 'input';
  nodeId?: string;
  fieldName?: string;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
  sortOrder?: number;
};

export type AppSchemaSection = {
  key: string;
  title: string;
  description?: string;
  sortOrder?: number;
};

export type AppLayoutSchema = {
  sections?: AppSchemaSection[];
};

export type AppResultSection = AppSchemaSection & {
  tips?: string[];
};

export type AppResultSchema = {
  sections?: AppResultSection[];
};

export type AccountCheckResponse = {
  state: 'ready' | 'error';
  serviceKey?: string;
  balance?: {
    rawBalance: string | null;
    displayBalance: string | null;
    displayMultiplier: number;
    checkedAt: string;
  };
  account?: {
    remainCoins: string;
    currentTaskCounts: string;
    apiType?: string | null;
  };
  message?: string;
  raw?: unknown;
};

export type ExecuteResponse = {
  taskId: string;
  state: 'queued' | 'running';
  debug?: unknown;
};

export type TaskStatusResponse = {
  taskId: string;
  state: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  message?: string;
  raw?: unknown;
};

export type TaskResultItem = {
  fileUrl: string;
  fileType?: string;
  taskCostTime?: string | number;
  consumeCoins?: string | number;
  consumeMoney?: string | number | null;
  thirdPartyConsumeMoney?: string | number | null;
};

export type TaskResultResponse = {
  taskId: string;
  state: 'PENDING' | 'SUCCESS' | 'FAILED';
  outputs: TaskResultItem[];
  message?: string;
  raw?: unknown;
};

export type HistoryTaskStatus =
  | 'queued'
  | 'submitted'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'timeout'
  | 'cancelled'
  | 'unknown';

export type HistoryTaskItem = {
  taskId: string;
  appSlug: string;
  displayName: string;
  status: HistoryTaskStatus;
  submittedAt: string;
  outputUrls: string[];
  linkExpiryReminder: string;
};

export type AdminSession = {
  id: number;
  username: string;
  lastLoginAt: string | null;
};

export type AdminFieldSchema = {
  fields: AppFieldDefinition[];
};

export type AdminAppSchema = {
  id: number;
  appId: number;
  schemaVersion: number;
  layoutSchema: AppLayoutSchema;
  fieldSchema: AdminFieldSchema;
  resultSchema: AppResultSchema;
  isPublished: boolean;
};

export type AdminSchemaEditorValue = {
  schemaVersion: number;
  timeoutSeconds: number;
  isPublished: boolean;
  layoutSchema: AppLayoutSchema;
  fieldSchema: AdminFieldSchema;
  resultSchema: AppResultSchema;
};

export type AdminApp = {
  id: number;
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
  publishedSchema?: AdminAppSchema | null;
};

export type AdminAppEditorValue = {
  slug: string;
  displayName: string;
  subtitle: string;
  description: string;
  coverImageUrl: string;
  tagsText: string;
  sortOrder: number;
  isEnabled: boolean;
  usageTipsText: string;
  resultTipsText: string;
  upstreamAppId: string;
  instanceType: string;
  usePersonalQueue: boolean;
  pollIntervalMs: number;
  maxPollAttempts: number;
  maxConcurrencyPerKey: number;
};

export type AdminTaskEvent = {
  id: number;
  eventType: string;
  eventPayload: Record<string, unknown>;
  createdAt: string | null;
};

export type AdminTaskRecord = {
  id: number;
  taskNo: string;
  appId: number;
  appSlug: string;
  displayName: string;
  apiKeyArchiveId: number;
  apiKeyHash: string;
  apiKeyMasked?: string;
  status: string;
  source: string;
  upstreamTaskId: string | null;
  upstreamStatus: string | null;
  inputSnapshot: Record<string, unknown>;
  normalizedParams: Record<string, unknown>;
  resultSnapshot: Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  submittedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  events: AdminTaskEvent[];
};

export type AdminMultiplierRecord = {
  id: number;
  apiKeyHash: string;
  apiKeyMasked: string;
  displayMultiplier: number | null;
  lastCheckedBalance: string | null;
  lastCheckedDisplayBalance: string | null;
  lastCheckedAt: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UpscaleFastFormValue = {
  file: File | null;
  enable8k: boolean;
};

export type SeedvrFormValue = {
  file: File | null;
  prompt: string;
};

export type DynamicFormValue = File | string | boolean | null;

export type DynamicFormValues = Record<string, DynamicFormValue>;

export type AppDefinition = {
  id: SupportedAppId;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  chips: string[];
  notes: string[];
  nodeSummary: string[];
  fields?: AppFieldDefinition[];
  layoutSchema?: AppLayoutSchema;
  resultSchema?: AppResultSchema;
};

export type SiteConfig = {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  defaultDisplayMultiplier: number;
  resultLinkNotice: string;
  customerSummaryTitle: string;
  customerSummaryText: string;
  targetAudienceTitle: string;
  targetAudience: string[];
  solutionHighlightsTitle: string;
  solutionHighlights: Array<{
    title: string;
    description: string;
    tag?: string;
  }>;
  workflowTitle: string;
  workflowSteps: string[];
  referenceGalleryTitle: string;
  referenceGallery: Array<{
    title: string;
    description: string;
    imageUrl: string;
    badge?: string;
  }>;
};
