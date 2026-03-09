import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AcrylicCard } from '../components/AcrylicCard';
import { fetchHistory } from '../features/history/historyApi';
import { usePublicAppContext } from '../router';
import type { HistoryTaskItem, HistoryTaskStatus } from '../types';

const STATUS_OPTIONS: Array<{ value: HistoryTaskStatus | ''; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'queued', label: '排队中' },
  { value: 'submitted', label: '已提交' },
  { value: 'running', label: '运行中' },
  { value: 'succeeded', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'timeout', label: '超时' },
  { value: 'cancelled', label: '已取消' },
];

function formatStatusLabel(status: string) {
  const match = STATUS_OPTIONS.find((item) => item.value === status);
  return match?.label ?? '未知状态';
}

function formatSubmittedAt(value: string) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
  });
}

function buildSearchParams(appSlug: string, status: string) {
  const nextParams = new URLSearchParams();
  if (appSlug) {
    nextParams.set('appSlug', appSlug);
  }
  if (status) {
    nextParams.set('status', status);
  }
  return nextParams;
}

export function HistoryPage() {
  const { apiKey, apps } = usePublicAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAppSlug, setSelectedAppSlug] = useState(() => searchParams.get('appSlug') ?? '');
  const [selectedStatus, setSelectedStatus] = useState(() => searchParams.get('status') ?? '');
  const [tasks, setTasks] = useState<HistoryTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedApp = useMemo(
    () => apps.find((item) => item.slug === selectedAppSlug) ?? null,
    [apps, selectedAppSlug],
  );

  useEffect(() => {
    if (!apiKey.trim()) {
      setTasks([]);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setErrorMessage(null);

    void fetchHistory({
      apiKey: apiKey.trim(),
      ...(selectedAppSlug ? { appSlug: selectedAppSlug } : {}),
      ...(selectedStatus ? { status: selectedStatus } : {}),
    })
      .then((nextTasks) => {
        if (!active) {
          return;
        }
        setTasks(nextTasks);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setTasks([]);
        setErrorMessage(error instanceof Error ? error.message : '读取任务记录失败');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [apiKey, selectedAppSlug, selectedStatus]);

  function handleAppChange(nextAppSlug: string) {
    setSelectedAppSlug(nextAppSlug);
    setSearchParams(buildSearchParams(nextAppSlug, selectedStatus), { replace: true });
  }

  function handleStatusChange(nextStatus: string) {
    setSelectedStatus(nextStatus);
    setSearchParams(buildSearchParams(selectedAppSlug, nextStatus), { replace: true });
  }

  return (
    <div className="page-stack">
      <AcrylicCard eyebrow="Task Archive" title="任务归档">
        {apiKey ? (
          <div className="history-panel">
            <div className="history-filter-grid">
              <label className="field-stack" htmlFor="history-app-filter">
                <span>应用筛选</span>
                <select
                  id="history-app-filter"
                  className="fluent-input"
                  value={selectedAppSlug}
                  onChange={(event) => handleAppChange(event.target.value)}
                >
                  <option value="">全部应用</option>
                  {apps.map((app) => (
                    <option key={app.slug} value={app.slug}>
                      {app.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-stack" htmlFor="history-status-filter">
                <span>状态筛选</span>
                <select
                  id="history-status-filter"
                  className="fluent-input"
                  value={selectedStatus}
                  onChange={(event) => handleStatusChange(event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedApp ? (
              <p className="field-note">当前正在查看「{selectedApp.title}」的任务记录。</p>
            ) : (
              <p className="field-note">默认展示当前服务密钥下的全部最近任务。</p>
            )}

            {loading ? <p className="lead-text">正在加载任务记录...</p> : null}
            {errorMessage ? <p className="lead-text">{errorMessage}</p> : null}

            {!loading && !errorMessage && tasks.length === 0 ? (
              <div className="empty-state">
                <p className="lead-text">当前筛选条件下还没有任务记录，先去默认工作台发起一次生成吧。</p>
                <Link to="/" className="button-link button-link-secondary">
                  返回控制台
                </Link>
              </div>
            ) : null}

            {!loading && !errorMessage && tasks.length > 0 ? (
              <div className="history-list">
                {tasks.map((task) => (
                  <article key={task.taskId} className="history-entry">
                    <div className="history-entry-header">
                      <div className="history-title-group">
                        <h3>{task.displayName}</h3>
                        <p className="muted-text">
                          任务编号：<code>{task.taskId}</code>
                        </p>
                      </div>
                      <span className="glass-chip">{formatStatusLabel(task.status)}</span>
                    </div>

                    <div className="history-meta-row">
                      <span>提交时间：{formatSubmittedAt(task.submittedAt)}</span>
                      <span>结果数量：{task.outputUrls.length}</span>
                    </div>

                    {task.outputUrls.length > 0 ? (
                      <div className="result-grid">
                        {task.outputUrls.map((fileUrl, index) => (
                          <article key={`${task.taskId}-${fileUrl}`} className="result-card">
                            <img src={fileUrl} alt={`${task.displayName} 输出结果 ${index + 1}`} />
                            <div className="result-meta">
                              <div className="result-actions">
                                <a href={fileUrl} download className="result-action-link">
                                  下载结果
                                </a>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="result-action-link"
                                >
                                  打开结果
                                </a>
                                {task.appSlug ? (
                                  <Link to={`/workspace/${task.appSlug}`} className="result-action-link">
                                    再次生成
                                  </Link>
                                ) : null}
                              </div>
                              <p className="field-note">{task.linkExpiryReminder}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <p className="muted-text">该任务暂无可展示结果，可能仍在处理中或已失败。</p>
                        {task.appSlug ? (
                          <Link to={`/workspace/${task.appSlug}`} className="button-link button-link-secondary">
                            再次生成
                          </Link>
                        ) : null}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">
            <p className="lead-text">请先设置服务密钥，任务记录才能按你的归档视角展示。</p>
            <Link to="/key-center" className="button-link button-link-primary">
              去设置服务密钥
            </Link>
          </div>
        )}
      </AcrylicCard>
    </div>
  );
}
