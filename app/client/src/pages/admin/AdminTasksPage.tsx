import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import { JsonPanel } from '../../components/JsonPanel';
import { PrimaryButton } from '../../components/PrimaryButton';
import { fetchAdminMe, fetchAdminTasks } from '../../features/admin/adminApi';
import type { AdminTaskRecord } from '../../types';

export function AdminTasksPage() {
  const navigate = useNavigate();
  const [taskNo, setTaskNo] = useState('');
  const [upstreamTaskId, setUpstreamTaskId] = useState('');
  const [apiKeyHash, setApiKeyHash] = useState('');
  const [tasks, setTasks] = useState<AdminTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchAdminMe()
      .then(() => fetchAdminTasks())
      .then((nextTasks) => {
        if (active) {
          setTasks(nextTasks);
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : '加载任务列表失败';
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

  async function handleSearch() {
    setSearching(true);
    setErrorMessage(null);
    try {
      const nextTasks = await fetchAdminTasks({
        ...(taskNo.trim() ? { taskNo: taskNo.trim() } : {}),
        ...(upstreamTaskId.trim() ? { upstreamTaskId: upstreamTaskId.trim() } : {}),
        ...(apiKeyHash.trim() ? { apiKeyHash: apiKeyHash.trim() } : {}),
      });
      setTasks(nextTasks);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '任务检索失败');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Admin</p>
        <h1>任务检索</h1>
        <p className="lead-text">可按平台任务 ID、上游任务 ID 与 API Key Hash 检索任务链路。</p>
      </header>

      <AcrylicCard eyebrow="Search" title="筛选条件">
        <div className="admin-form-grid">
          <label className="field-stack">
            <span>平台任务 ID</span>
            <input className="fluent-input" value={taskNo} onChange={(event) => setTaskNo(event.target.value)} />
          </label>
          <label className="field-stack">
            <span>上游任务 ID</span>
            <input
              className="fluent-input"
              value={upstreamTaskId}
              onChange={(event) => setUpstreamTaskId(event.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>API Key Hash</span>
            <input
              className="fluent-input"
              value={apiKeyHash}
              onChange={(event) => setApiKeyHash(event.target.value)}
            />
          </label>
        </div>
        <div className="button-row">
          <PrimaryButton type="button" onClick={() => void handleSearch()} disabled={searching}>
            {searching ? '检索中...' : '开始检索'}
          </PrimaryButton>
        </div>
        {loading ? <p className="lead-text">正在加载任务列表...</p> : null}
        {errorMessage ? <p className="field-note">{errorMessage}</p> : null}
      </AcrylicCard>

      <div className="admin-task-list">
        {tasks.map((task) => (
          <AcrylicCard
            key={task.taskNo}
            eyebrow="Task"
            title={task.taskNo}
            actions={<span className="glass-chip">{task.status}</span>}
          >
            <div className="details-grid">
              <div>
                <p className="lead-text">应用：{task.displayName || task.appSlug || '--'}</p>
                <p className="field-note">上游任务：{task.upstreamTaskId ?? '--'}</p>
                <p className="field-note">API Key Hash：{task.apiKeyHash || '--'}</p>
                <p className="field-note">失败原因：{task.errorMessage || '--'}</p>
              </div>
              <div>
                <p className="lead-text">事件数：{task.events.length}</p>
                <p className="field-note">提交时间：{task.submittedAt ?? '--'}</p>
                <p className="field-note">完成时间：{task.finishedAt ?? '--'}</p>
              </div>
            </div>
            <div className="split-panel">
              <JsonPanel title="输入快照" payload={task.inputSnapshot} />
              <JsonPanel title="事件链" payload={task.events} />
            </div>
          </AcrylicCard>
        ))}

        {!loading && tasks.length === 0 ? (
          <AcrylicCard eyebrow="Empty" title="暂无结果">
            <p className="lead-text">当前条件下没有查到任务，建议缩小或更换检索条件。</p>
          </AcrylicCard>
        ) : null}
      </div>
    </div>
  );
}
