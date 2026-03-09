import { badRequest } from '../errors.js';
import { getSupportedApp } from '../config/apps.js';

export interface ExecuteFormValues {
  [key: string]: string | boolean | undefined;
  prompt?: string;
  enable8k?: boolean;
}

export function validateExecuteInput(input: {
  appId: string;
  apiKey?: string;
  uploadedFiles: Record<string, string | undefined>;
}) {
  if (!input.apiKey) {
    throw badRequest('缺少 apiKey');
  }

  const app = getSupportedApp(input.appId);
  const missingRequiredFileField = app.fields.find(
    (field) => field.type === 'file' && field.required && !input.uploadedFiles[field.key],
  );

  if (missingRequiredFileField) {
    throw badRequest(`缺少上传图片：${missingRequiredFileField.label}`);
  }
}

export function buildNodeInfoListForApp(input: {
  appId: string;
  uploadedFiles: Record<string, string | undefined>;
  formValues: ExecuteFormValues;
}) {
  const app = getSupportedApp(input.appId);
  return app.buildNodeInfoList({
    uploadedFiles: input.uploadedFiles,
    formValues: input.formValues,
  });
}

export type TaskState = 'submitted' | 'running' | 'succeeded' | 'failed';

function readRunningHubStatus(statusPayload: any): string | undefined {
  if (typeof statusPayload?.data === 'string') {
    return statusPayload.data;
  }
  if (typeof statusPayload?.data?.status === 'string') {
    return statusPayload.data.status;
  }
  return undefined;
}

export function normalizeTaskState(statusPayload: any, outputsPayload?: any): TaskState {
  const status = readRunningHubStatus(statusPayload);

  if ([301, 412, 433, 805, 807, 1601].includes(statusPayload?.code)) {
    return 'failed';
  }
  if (outputsPayload?.code === 0 && Array.isArray(outputsPayload?.data) && outputsPayload.data.length > 0) {
    return 'succeeded';
  }
  if ([301, 412, 433, 805, 807, 1601].includes(outputsPayload?.code)) {
    return 'failed';
  }
  if (['FAILED', 'ERROR'].includes(status || '')) {
    return 'failed';
  }
  if (['RUNNING', 'QUEUED', 'PENDING', 'PROCESSING', 'SUCCESS'].includes(status || '')) {
    return outputsPayload?.code === 0 ? 'succeeded' : 'running';
  }
  return 'submitted';
}
