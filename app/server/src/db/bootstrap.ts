import type { Pool } from 'pg';

import type { AppFieldDefinition, SupportedAppDefinition } from '../config/apps.js';
import { listPublicSupportedApps, listSupportedApps } from '../config/apps.js';
import { createAppRepository } from '../repositories/appRepository.js';

function inferDefaultSectionKey(field: AppFieldDefinition) {
  if (field.sectionKey) {
    return field.sectionKey;
  }

  if (field.type === 'file') {
    return 'materials';
  }

  return 'settings';
}

function inferDefaultSectionTitle(field: AppFieldDefinition, sectionKey: string) {
  if (field.group) {
    return field.group;
  }

  switch (sectionKey) {
    case 'brief':
      return '创作说明';
    case 'references':
      return '参考素材';
    case 'materials':
      return '上传素材';
    case 'settings':
      return '输出设置';
    default:
      return '参数设置';
  }
}

function buildDefaultLayoutSchema(app: SupportedAppDefinition) {
  const sectionMap = new Map<string, { key: string; title: string }>();

  for (const field of app.fields) {
    const sectionKey = inferDefaultSectionKey(field);
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        key: sectionKey,
        title: inferDefaultSectionTitle(field, sectionKey),
      });
    }
  }

  return {
    sections:
      sectionMap.size > 0
        ? [...sectionMap.values()]
        : [
            {
              key: 'basic',
              title: `${app.shortLabel} 参数`,
            },
          ],
  };
}

function buildDefaultFieldSchema(fields: AppFieldDefinition[]) {
  const groupMap = new Map<string, { key: string; title: string; fields: string[] }>();

  for (const field of fields) {
    const sectionKey = inferDefaultSectionKey(field);
    const title = inferDefaultSectionTitle(field, sectionKey);
    const current = groupMap.get(sectionKey);

    if (current) {
      current.fields.push(field.key);
      continue;
    }

    groupMap.set(sectionKey, {
      key: sectionKey,
      title,
      fields: [field.key],
    });
  }

  return {
    groups: [...groupMap.values()],
    fields: fields.map((field) => {
      const sectionKey = inferDefaultSectionKey(field);
      return {
        ...field,
        sectionKey,
        group: field.group ?? inferDefaultSectionTitle(field, sectionKey),
      };
    }),
  };
}

function buildDefaultResultSchema(app: SupportedAppDefinition) {
  return {
    sections: [
      {
        key: 'result',
        title: '输出结果',
        tips: app.notes,
      },
    ],
  };
}

function buildDefaultAppSeed(app: SupportedAppDefinition, sortOrder: number) {
  return {
    slug: app.slug,
    displayName: app.label,
    subtitle: app.shortLabel,
    description: app.description,
    coverImageUrl: null,
    tags: [...app.chips],
    sortOrder,
    isEnabled: true,
    usageTips: [...app.notes],
    resultTips: [],
    upstreamAppId: app.id,
    instanceType: 'default',
    usePersonalQueue: false,
    pollIntervalMs: 3000,
    maxPollAttempts: 20,
    timeoutSeconds: 180,
    maxConcurrencyPerKey: 1,
  };
}

function readPublishedFieldKeys(publishedSchema: any): string[] {
  if (!Array.isArray(publishedSchema?.fieldSchema?.fields)) {
    return [];
  }

  return publishedSchema.fieldSchema.fields
    .map((field: Record<string, unknown>) => String(field.key ?? ''))
    .filter((key: string) => key.length > 0);
}

function readPublishedSectionKeys(publishedSchema: any): string[] {
  if (!Array.isArray(publishedSchema?.layoutSchema?.sections)) {
    return [];
  }

  return publishedSchema.layoutSchema.sections
    .map((section: Record<string, unknown>) => String(section.key ?? ''))
    .filter((key: string) => key.length > 0);
}

function shouldRefreshBundledSchema(existingPublishedSchema: any, app: SupportedAppDefinition) {
  if (!existingPublishedSchema) {
    return true;
  }

  const existingFieldKeys = readPublishedFieldKeys(existingPublishedSchema);
  const targetFieldKeys = app.fields.map((field) => field.key);
  if (existingFieldKeys.join('|') !== targetFieldKeys.join('|')) {
    return true;
  }

  const existingSectionKeys = readPublishedSectionKeys(existingPublishedSchema);
  const targetSectionKeys = buildDefaultLayoutSchema(app).sections.map((section) => section.key);
  return existingSectionKeys.join('|') !== targetSectionKeys.join('|');
}

export async function ensureBundledApps(pool: Pool) {
  const repository = createAppRepository(pool);
  const existingApps = await repository.listApps();
  const appByUpstreamId = new Map(existingApps.map((app) => [app.upstreamAppId, app]));
  const publicSupportedApps = listPublicSupportedApps();
  const publicSupportedIds = new Set(publicSupportedApps.map((app) => app.id));
  const legacyBundledIds = new Set(
    listSupportedApps()
      .map((app) => app.id)
      .filter((id) => !publicSupportedIds.has(id)),
  );

  for (const existing of existingApps) {
    if (legacyBundledIds.has(existing.upstreamAppId) && existing.isEnabled) {
      await repository.updateApp(existing.id, {
        isEnabled: false,
      });
    }
  }

  for (const [index, app] of publicSupportedApps.entries()) {
    const existing = appByUpstreamId.get(app.id);
    const targetApp = existing
      ? await repository.updateApp(existing.id, buildDefaultAppSeed(app, index + 1))
      : await repository.createApp(buildDefaultAppSeed(app, index + 1));

    if (shouldRefreshBundledSchema(existing?.publishedSchema, app)) {
      const nextSchemaVersion = await repository.getNextSchemaVersion(targetApp.id);
      await repository.saveSchema({
        appId: targetApp.id,
        schemaVersion: nextSchemaVersion,
        layoutSchema: buildDefaultLayoutSchema(app),
        fieldSchema: buildDefaultFieldSchema(app.fields),
        resultSchema: buildDefaultResultSchema(app),
        isPublished: true,
      });
    }
  }
}
