import type { Pool } from 'pg';

import { listPublicSupportedApps } from '../config/apps.js';
import { createAppRepository } from '../repositories/appRepository.js';

type PublicAppSummary = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  chips: string[];
  notes: string[];
  nodeSummary: string[];
  fields: Array<Record<string, unknown>>;
  layoutSchema?: Record<string, unknown>;
  resultSchema?: Record<string, unknown>;
};

function buildStaticFallbackApps(): PublicAppSummary[] {
  return listPublicSupportedApps().map((app) => ({
    id: app.id,
    slug: app.slug,
    title: app.label,
    shortTitle: app.shortLabel,
    description: app.description,
    chips: [...app.chips],
    notes: [...app.notes],
    nodeSummary: [...app.nodeSummary],
    fields: app.fields.map((field) => ({ ...field })),
    layoutSchema: undefined,
    resultSchema: undefined,
  }));
}

function mergePublishedAppWithFallback(
  fallbackApp: PublicAppSummary,
  publishedApp?: {
    displayName: string;
    subtitle: string;
    description: string;
    tags: string[];
    usageTips: string[];
    resultTips: string[];
    publishedSchema: {
      fieldSchema: Record<string, unknown>;
      layoutSchema: Record<string, unknown>;
      resultSchema: Record<string, unknown>;
    };
  },
): PublicAppSummary {
  if (!publishedApp) {
    return fallbackApp;
  }

  return {
    ...fallbackApp,
    title: publishedApp.displayName,
    shortTitle: publishedApp.subtitle,
    description: publishedApp.description,
    chips: [...publishedApp.tags],
    notes: [...publishedApp.usageTips, ...publishedApp.resultTips],
    fields: Array.isArray(publishedApp.publishedSchema.fieldSchema.fields)
      ? (publishedApp.publishedSchema.fieldSchema.fields as Array<Record<string, unknown>>)
      : fallbackApp.fields,
    layoutSchema: publishedApp.publishedSchema.layoutSchema,
    resultSchema: publishedApp.publishedSchema.resultSchema,
  };
}

export function createAppCatalog(pool?: Pool) {
  if (!pool) {
    return {
      listPublicApps: async () => buildStaticFallbackApps(),
    };
  }

  const repository = createAppRepository(pool);

  return {
    async listPublicApps(): Promise<PublicAppSummary[]> {
      const fallbackApps = buildStaticFallbackApps();
      const publishedApps = await repository.listPublishedApps();
      if (publishedApps.length === 0) {
        return fallbackApps;
      }

      const publishedAppByUpstreamId = new Map(
        publishedApps.map((app) => [app.upstreamAppId, app]),
      );

      return fallbackApps.map((fallbackApp) =>
        mergePublishedAppWithFallback(
          fallbackApp,
          publishedAppByUpstreamId.get(fallbackApp.id),
        ),
      );
    },
  };
}
