import { buildApiUrl } from '../../apiBase';
import type { AppDefinition } from '../../types';

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? '读取应用清单失败');
  }
  return payload;
}

export async function fetchSupportedApps(): Promise<AppDefinition[]> {
  const response = await fetch(buildApiUrl('/api/apps'));
  const payload = await readJson(response);
  if (!Array.isArray(payload?.apps)) {
    return [];
  }

  return payload.apps.map((app: Record<string, unknown>) => ({
    id: String(app.id ?? ''),
    slug: typeof app.slug === 'string' && app.slug.trim() ? app.slug : String(app.id ?? ''),
    title: String(app.title ?? ''),
    shortTitle: String(app.shortTitle ?? app.title ?? ''),
    description: String(app.description ?? ''),
    chips: Array.isArray(app.chips) ? app.chips.map((item) => String(item)) : [],
    notes: Array.isArray(app.notes) ? app.notes.map((item) => String(item)) : [],
    nodeSummary: Array.isArray(app.nodeSummary) ? app.nodeSummary.map((item) => String(item)) : [],
    fields: Array.isArray(app.fields) ? app.fields : [],
    layoutSchema:
      app.layoutSchema && typeof app.layoutSchema === 'object'
        ? (app.layoutSchema as Record<string, unknown>)
        : undefined,
    resultSchema:
      app.resultSchema && typeof app.resultSchema === 'object'
        ? (app.resultSchema as Record<string, unknown>)
        : undefined,
  }));
}
