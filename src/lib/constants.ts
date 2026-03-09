export const FIELD_TYPES = ["IMAGE", "STRING", "INT", "LIST", "BOOLEAN"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const TASK_STATUSES = ["QUEUED", "RUNNING", "SUCCESS", "FAILED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 10485760; // 10MB
export const MAX_CONCURRENT_TASKS = Number(process.env.MAX_CONCURRENT_TASKS) || 30;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const RH_API_BASE = "https://www.runninghub.cn";

export const POLLING_INTERVALS = {
  FAST: 3000,      // 0-30s
  MEDIUM: 5000,    // 30-120s
  SLOW: 10000,     // 120s+
  TIMEOUT: 600000, // 10min
} as const;
