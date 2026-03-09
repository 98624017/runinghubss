import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import {
  fetchAdminApps,
  fetchAdminMe,
  fetchAdminTasks,
} from '../../features/admin/adminApi';
import type { AdminApp, AdminSession, AdminTaskRecord } from '../../types';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [apps, setApps] = useState<AdminApp[]>([]);
  const [tasks, setTasks] = useState<AdminTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([fetchAdminMe(), fetchAdminApps(), fetchAdminTasks()])
      .then(([nextAdmin, nextApps, nextTasks]) => {
        if (!active) {
          return;
        }
        setAdmin(nextAdmin);
        setApps(nextApps);
        setTasks(nextTasks);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : '加载后台概览失败';
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

  const enabledCount = useMemo(() => apps.filter((app) => app.isEnabled).length, [apps]);
  const publishedSchemaCount = useMemo(
    () => apps.filter((app) => Boolean(app.publishedSchema?.isPublished)).length,
    [apps],
  );
  const runningCount = useMemo(
    () => tasks.filter((task) => ['queued', 'submitted', 'running'].includes(task.status)).length,
    [tasks],
  );
  const failedTasks = useMemo(
    () => tasks.filter((task) => ['failed', 'timeout', 'cancelled'].includes(task.status)),
    [tasks],
  );

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Admin</p>
        <h1>后台概览</h1>
        <p className="lead-text">汇总应用配置、任务状态与最近异常，方便运营和排障。</p>
      </header>

      <section className="metric-grid">
        <div className="metric-card">
          <span>当前管理员</span>
          <strong>{admin?.username ?? '--'}</strong>
        </div>
        <div className="metric-card">
          <span>上架应用数</span>
          <strong>{enabledCount}</strong>
        </div>
        <div className="metric-card">
          <span>已发布 Schema</span>
          <strong>{publishedSchemaCount}</strong>
        </div>
        <div className="metric-card">
          <span>运行中任务</span>
          <strong>{runningCount}</strong>
        </div>
      </section>

      <section className="split-panel">
        <AcrylicCard eyebrow="Overview" title="系统状态">
          {loading ? <p className="lead-text">正在加载后台数据...</p> : null}
          {errorMessage ? <p className="lead-text">{errorMessage}</p> : null}
          {!loading && !errorMessage ? (
            <div className="form-stack">
              <p className="lead-text">总任务数：{tasks.length}</p>
              <p className="lead-text">失败/超时任务：{failedTasks.length}</p>
              <p className="field-note">
                最近登录：{admin?.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('zh-CN') : '--'}
              </p>
              <div className="button-row">
                <Link to="/admin/site" className="button-link button-link-secondary">
                  编辑站点内容
                </Link>
                <Link to="/admin/apps" className="button-link button-link-primary">
                  进入应用管理
                </Link>
                <Link to="/admin/tasks" className="button-link button-link-secondary">
                  查看任务检索
                </Link>
              </div>
            </div>
          ) : null}
        </AcrylicCard>

        <AcrylicCard eyebrow="Incidents" title="最近异常任务">
          {failedTasks.length > 0 ? (
            <ul className="meta-list">
              {failedTasks.slice(0, 5).map((task) => (
                <li key={task.taskNo}>
                  {task.taskNo} · {task.displayName || task.appSlug || '未命名应用'} ·{' '}
                  {task.errorMessage || task.status}
                </li>
              ))}
            </ul>
          ) : (
            <p className="lead-text">当前没有失败任务，可继续关注新应用发布与轮询超时策略。</p>
          )}
        </AcrylicCard>
      </section>

      <AcrylicCard eyebrow="Site" title="站点内容入口">
        <div className="form-stack">
          <p className="lead-text">
            首页宣传、客户资料摘要、参考物料与工作流说明统一在独立页面维护，避免后台概览和内容配置双入口漂移。
          </p>
          <div className="button-row">
            <Link to="/admin/site" className="button-link button-link-primary">
              前往站点内容页
            </Link>
          </div>
        </div>
      </AcrylicCard>
    </div>
  );
}
