import type { Router } from 'express';
import { Router as createRouter } from 'express';
import multer from 'multer';
import type { Pool } from 'pg';

import { getSupportedApp, listSupportedApps } from '../config/apps.js';
import { createAppCatalog } from '../services/appCatalog.js';
import { buildNodeInfoListForApp, validateExecuteInput } from '../services/payloadBuilders.js';
import { sanitizePayload } from '../services/sanitize.js';
import type { createTaskDispatcher } from '../services/taskDispatcher.js';
import type { RunningHubClient } from '../services/runninghubClient.js';

const upload = multer({ storage: multer.memoryStorage() });

function getSingleValue(input: unknown): string {
  if (Array.isArray(input)) {
    return String(input[0] || '');
  }
  return String(input || '');
}

function parseBooleanValue(input: unknown): boolean | undefined {
  if (typeof input === 'boolean') {
    return input;
  }

  const normalized = getSingleValue(input).trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return undefined;
}

function buildFormValuesFromFields(
  fields: Array<{
    key: string;
    type: 'file' | 'boolean' | 'text';
    defaultValue?: string | boolean;
  }>,
  body: Record<string, unknown> | undefined,
): Record<string, string | boolean | undefined> {
  // 通过字段定义统一解析表单值，避免路由层继续硬编码 prompt / enable8k。
  return fields.reduce<Record<string, string | boolean | undefined>>((formValues, field) => {
    if (field.type === 'file') {
      return formValues;
    }

    const rawValue = body?.[field.key];

    if (field.type === 'boolean') {
      formValues[field.key] =
        parseBooleanValue(rawValue) ?? (typeof field.defaultValue === 'boolean' ? field.defaultValue : false);
      return formValues;
    }

    const value = getSingleValue(rawValue);
    formValues[field.key] = value || (typeof field.defaultValue === 'string' ? field.defaultValue : undefined);
    return formValues;
  }, {});
}

async function uploadFilesByField(
  client: RunningHubClient,
  apiKey: string,
  files: Express.Multer.File[],
) {
  // 这里按字段名分组上传，保证多图应用也能沿用同一条执行链。
  const uploadedFiles: Record<string, string | undefined> = {};
  const uploadResults: Array<{ fieldName: string; uploadResult: unknown }> = [];

  for (const file of files) {
    const uploadResult = await client.uploadFile(apiKey, {
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
    });
    const uploadedFileName = uploadResult?.data?.fileName;
    if (!uploadedFileName) {
      throw new Error(`上传成功响应中缺少 fileName：${file.fieldname}`);
    }
    uploadedFiles[file.fieldname] = uploadedFileName;
    uploadResults.push({
      fieldName: file.fieldname,
      uploadResult,
    });
  }

  return { uploadedFiles, uploadResults };
}

export function createAppsRouter(
  client: RunningHubClient,
  options: { pool?: Pool; taskDispatcher?: ReturnType<typeof createTaskDispatcher> } = {},
): Router {
  const router = createRouter();
  const catalog = createAppCatalog(options.pool);

  router.get('/', async (_req, res) => {
    return res.json({
      ok: true,
      apps: await catalog.listPublicApps(),
    });
  });

  router.post('/:appId/execute', upload.any(), async (req, res) => {
    const appId = String(req.params.appId);
    const apiKey = getSingleValue(req.body?.apiKey);
    const app = getSupportedApp(appId);
    const requestFiles = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];
    const receivedFiles = Object.fromEntries(
      requestFiles.map((file) => [file.fieldname, file.originalname]),
    ) as Record<string, string | undefined>;
    validateExecuteInput({ appId, apiKey, uploadedFiles: receivedFiles });
    const { uploadedFiles, uploadResults } = await uploadFilesByField(client, apiKey, requestFiles);

    const formValues = buildFormValuesFromFields(
      app.fields,
      req.body as Record<string, unknown> | undefined,
    );
    const nodeInfoList = buildNodeInfoListForApp({
      appId,
      uploadedFiles,
      formValues,
    });

    const submitPayload = {
      webappId: app.id,
      nodeInfoList,
    };

    if (options.taskDispatcher) {
      const localTask = await options.taskDispatcher.submitTask({
        upstreamAppId: app.id,
        apiKey,
        source: 'public-web',
        inputSnapshot: {
          appId,
          formValues,
        },
        normalizedParams: submitPayload,
      });

      return res.json({
        ok: true,
        app: {
          id: app.id,
          label: app.label,
        },
        taskId: localTask.taskNo,
        state: localTask.status,
        debug: sanitizePayload(
          {
            uploadResults,
            nodeInfoList,
            platformTaskId: localTask.taskNo,
          },
          apiKey,
        ),
      });
    }

    const submitResult = await client.runAiApp(apiKey, submitPayload);

    return res.json({
      ok: true,
      app: {
        id: app.id,
        label: app.label,
      },
      taskId: submitResult?.data?.taskId ?? null,
      state: 'submitted',
      debug: sanitizePayload(
        {
          uploadResults,
          submitResult,
          nodeInfoList,
        },
        apiKey,
      ),
    });
  });

  return router;
}
