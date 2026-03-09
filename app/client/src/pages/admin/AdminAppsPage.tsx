import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import {
  createAdminApp,
  fetchAdminApps,
  fetchAdminMe,
  publishAdminSchema,
  saveAppSchema,
  updateAdminApp,
} from '../../features/admin/adminApi';
import { createEmptyAdminAppDraft, SchemaEditor, type AdminAppDraft } from '../../features/admin/SchemaEditor';
import type { AdminApp, AdminSession } from '../../types';

function joinLines(items: string[]) {
  return items.join('\n');
}

function createDraftFromAdminApp(app: AdminApp): AdminAppDraft {
  const fields = app.publishedSchema?.fieldSchema.fields ?? [];
  return {
    slug: app.slug,
    displayName: app.displayName,
    subtitle: app.subtitle,
    description: app.description,
    coverImageUrl: app.coverImageUrl ?? '',
    tagsText: joinLines(app.tags),
    sortOrder: app.sortOrder,
    isEnabled: app.isEnabled,
    usageTipsText: joinLines(app.usageTips),
    resultTipsText: joinLines(app.resultTips),
    upstreamAppId: app.upstreamAppId,
    instanceType: app.instanceType,
    usePersonalQueue: app.usePersonalQueue,
    pollIntervalMs: app.pollIntervalMs,
    maxPollAttempts: app.maxPollAttempts,
    maxConcurrencyPerKey: app.maxConcurrencyPerKey,
    schemaVersion: Math.max(1, (app.publishedSchema?.schemaVersion ?? 0) + 1),
    timeoutSeconds: app.timeoutSeconds,
    isPublished: true,
    layoutSchema: {
      sections: app.publishedSchema?.layoutSchema.sections ?? [{ key: 'inputs', title: '输入区' }],
    },
    fieldSchema: {
      fields,
    },
    fields,
    resultSchema:
      app.publishedSchema?.resultSchema ?? {
        sections: [{ key: 'results', title: '结果说明', description: '' }],
      },
  };
}

export function AdminAppsPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [apps, setApps] = useState<AdminApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [draft, setDraft] = useState<AdminAppDraft>(createEmptyAdminAppDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedApp = useMemo(
    () => apps.find((app) => app.id === selectedAppId) ?? null,
    [apps, selectedAppId],
  );

  useEffect(() => {
    let active = true;

    void Promise.all([fetchAdminMe(), fetchAdminApps()])
      .then(([nextAdmin, nextApps]) => {
        if (!active) {
          return;
        }
        setAdmin(nextAdmin);
        setApps(nextApps);
        if (nextApps[0]) {
          setSelectedAppId(nextApps[0].id);
          setDraft(createDraftFromAdminApp(nextApps[0]));
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : '后台数据加载失败';
        if (message.includes('未登录') || message.includes('登录已失效')) {
          navigate('/admin/login', { replace: true });
          return;
        }
        setErrorMessage(message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  function loadApp(app: AdminApp | null) {
    if (!app) {
      setSelectedAppId(null);
      setDraft(createEmptyAdminAppDraft());
      return;
    }

    setSelectedAppId(app.id);
    setDraft(createDraftFromAdminApp(app));
  }

  async function handleSaveApp() {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      if (selectedAppId) {
        const updatedApp = await updateAdminApp(selectedAppId, {
          ...draft,
          timeoutSeconds: draft.timeoutSeconds,
        });
        setApps((currentApps) =>
          currentApps.map((app) =>
            app.id === selectedAppId
              ? {
                  ...updatedApp,
                  publishedSchema: app.publishedSchema ?? null,
                }
              : app,
          ),
        );
        setStatusMessage(`已保存应用：${updatedApp.displayName}`);
        return;
      }

      const createdApp = await createAdminApp({
        ...draft,
        timeoutSeconds: draft.timeoutSeconds,
      });
      const publishedSchema = await saveAppSchema(createdApp.id, {
        ...draft,
        timeoutSeconds: draft.timeoutSeconds,
      });
      setApps((currentApps) => [
        ...currentApps,
        {
          ...createdApp,
          publishedSchema,
        },
      ]);
      setSelectedAppId(createdApp.id);
      setStatusMessage('应用已保存并发布最新 schema。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '保存应用失败');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishSchema() {
    if (!selectedAppId) {
      setErrorMessage('请先保存应用，再发布 schema');
      return;
    }

    setPublishing(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const publishedSchema = await publishAdminSchema(selectedAppId, {
        schemaVersion: draft.schemaVersion,
        timeoutSeconds: draft.timeoutSeconds,
        isPublished: draft.isPublished,
        layoutSchema: draft.layoutSchema,
        fieldSchema: {
          fields: draft.fields,
        },
        resultSchema: draft.resultSchema,
      });
      setApps((currentApps) =>
        currentApps.map((app) =>
          app.id === selectedAppId
            ? {
                ...app,
                timeoutSeconds: draft.timeoutSeconds,
                publishedSchema,
              }
            : app,
        ),
      );
      setStatusMessage(`已发布 schema v${publishedSchema.schemaVersion}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '发布 schema 失败');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Admin</p>
        <h1>应用管理</h1>
        <p className="lead-text">管理应用展示字段、上游参数、schema 和总体超时时间。</p>
      </header>

      <section className="split-panel">
        <AcrylicCard
          eyebrow="App Catalog"
          title="应用目录"
          actions={
            <button
              type="button"
              className="button-link button-link-secondary"
              onClick={() => loadApp(null)}
            >
              新建应用
            </button>
          }
        >
          {loading ? <p className="lead-text">正在加载应用目录...</p> : null}
          {!loading && apps.length === 0 ? <p className="lead-text">当前还没有应用，请先创建。</p> : null}
          <div className="admin-list">
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                className={`admin-list-item${selectedAppId === app.id ? ' is-selected' : ''}`}
                onClick={() => loadApp(app)}
              >
                <strong>{app.displayName}</strong>
                <span>{app.slug}</span>
              </button>
            ))}
          </div>
        </AcrylicCard>

        <AcrylicCard eyebrow="Meta" title="应用元信息">
          <p className="field-note">当前管理员：{admin?.username ?? '--'}</p>
          {selectedApp ? (
            <ul className="meta-list">
              <li>当前选中：{selectedApp.displayName}</li>
              <li>真实上游 App ID：{selectedApp.upstreamAppId}</li>
              <li>已发布 Schema：v{selectedApp.publishedSchema?.schemaVersion ?? '--'}</li>
            </ul>
          ) : (
            <p className="lead-text">新建模式下先填写业务展示层与技术配置层，再保存应用。</p>
          )}
          {statusMessage ? <p className="field-note">{statusMessage}</p> : null}
          {errorMessage ? <p className="field-note">{errorMessage}</p> : null}
        </AcrylicCard>
      </section>

      <AcrylicCard eyebrow="Business + Tech" title="应用配置表单">
        <div className="admin-form-grid">
          <label className="field-stack">
            <span>应用标识</span>
            <input
              className="fluent-input"
              aria-label="应用标识"
              value={draft.slug}
              onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
            />
          </label>
          <label className="field-stack">
            <span>应用标题</span>
            <input
              className="fluent-input"
              aria-label="前台显示名称"
              value={draft.displayName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
            />
          </label>
          <label className="field-stack">
            <span>副标题</span>
            <input
              className="fluent-input"
              value={draft.subtitle}
              onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))}
            />
          </label>
          <label className="field-stack">
            <span>封面图 URL</span>
            <input
              className="fluent-input"
              value={draft.coverImageUrl}
              onChange={(event) =>
                setDraft((current) => ({ ...current, coverImageUrl: event.target.value }))
              }
            />
          </label>
          <label className="field-stack admin-form-grid-full">
            <span>应用描述</span>
            <textarea
              className="fluent-textarea"
              aria-label="应用描述"
              rows={4}
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>
          <label className="field-stack">
            <span>标签（每行一个）</span>
            <textarea
              className="fluent-textarea"
              rows={4}
              value={draft.tagsText}
              onChange={(event) => setDraft((current) => ({ ...current, tagsText: event.target.value }))}
            />
          </label>
          <label className="field-stack">
            <span>使用提示（每行一个）</span>
            <textarea
              className="fluent-textarea"
              rows={4}
              value={draft.usageTipsText}
              onChange={(event) =>
                setDraft((current) => ({ ...current, usageTipsText: event.target.value }))
              }
            />
          </label>
          <label className="field-stack">
            <span>结果说明（每行一个）</span>
            <textarea
              className="fluent-textarea"
              rows={4}
              value={draft.resultTipsText}
              onChange={(event) =>
                setDraft((current) => ({ ...current, resultTipsText: event.target.value }))
              }
            />
          </label>
          <label className="field-stack">
            <span>排序</span>
            <input
              className="fluent-input"
              type="number"
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({ ...current, sortOrder: Number(event.target.value || 0) }))
              }
            />
          </label>
          <label className="field-stack">
            <span>上游 App ID</span>
            <input
              className="fluent-input"
              value={draft.upstreamAppId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, upstreamAppId: event.target.value }))
              }
            />
          </label>
          <label className="field-stack">
            <span>instanceType</span>
            <input
              className="fluent-input"
              value={draft.instanceType}
              onChange={(event) =>
                setDraft((current) => ({ ...current, instanceType: event.target.value }))
              }
            />
          </label>
          <label className="field-stack">
            <span>轮询间隔（毫秒）</span>
            <input
              className="fluent-input"
              type="number"
              value={draft.pollIntervalMs}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pollIntervalMs: Number(event.target.value || 0),
                }))
              }
            />
          </label>
          <label className="field-stack">
            <span>最大轮询次数</span>
            <input
              className="fluent-input"
              type="number"
              value={draft.maxPollAttempts}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxPollAttempts: Number(event.target.value || 0),
                }))
              }
            />
          </label>
          <label className="field-stack">
            <span>单 Key 并发限制</span>
            <input
              className="fluent-input"
              type="number"
              value={draft.maxConcurrencyPerKey}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxConcurrencyPerKey: Number(event.target.value || 0),
                }))
              }
            />
          </label>
          <label className="toggle-field">
            <span className="toggle-copy">
              <strong>启用上游个人队列</strong>
              <small>后台保留真实上游参数，便于排障与性能调优。</small>
            </span>
            <span className="toggle-control">
              <input
                aria-label="启用上游个人队列"
                type="checkbox"
                checked={draft.usePersonalQueue}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    usePersonalQueue: event.target.checked,
                  }))
                }
              />
              <span className="toggle-slider" />
            </span>
          </label>
          <label className="toggle-field">
            <span className="toggle-copy">
              <strong>应用是否上架</strong>
              <small>关闭后前台 `/api/apps` 不再返回该应用。</small>
            </span>
            <span className="toggle-control">
              <input
                aria-label="应用是否上架"
                type="checkbox"
                checked={draft.isEnabled}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    isEnabled: event.target.checked,
                  }))
                }
              />
              <span className="toggle-slider" />
            </span>
          </label>
        </div>

        <div className="button-row">
          <PrimaryButton type="button" onClick={() => void handleSaveApp()} disabled={saving}>
            {saving ? '保存中...' : '保存应用'}
          </PrimaryButton>
        </div>
      </AcrylicCard>

      <AcrylicCard eyebrow="Schema Editor" title="工作区编排配置">
        <SchemaEditor value={draft} onChange={setDraft} />
        <div className="button-row">
          <PrimaryButton type="button" onClick={() => void handlePublishSchema()} disabled={publishing}>
            {publishing ? '发布中...' : '发布 schema'}
          </PrimaryButton>
        </div>
      </AcrylicCard>
    </div>
  );
}
