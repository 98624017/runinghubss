import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import { fetchHistory } from '../history/historyApi';
import type { HistoryTaskItem } from '../../types';

type RecentTaskPanelProps = {
  apiKey: string;
};

function formatSubmittedAt(value: string) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', { hour12: false });
}

export function RecentTaskPanel({ apiKey }: RecentTaskPanelProps) {
  const [tasks, setTasks] = useState<HistoryTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey.trim()) {
      setTasks([]);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    let active = true;
    setLoading(true);
    setErrorMessage(null);

    void fetchHistory({ apiKey: apiKey.trim() })
      .then((nextTasks) => {
        if (active) {
          setTasks(nextTasks.slice(0, 4));
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTasks([]);
          setErrorMessage(error instanceof Error ? error.message : '读取最近任务失败');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [apiKey]);

  return (
    <AcrylicCard eyebrow="Recent Tasks" title="最近任务">
      {!apiKey.trim() ? (
        <div className="empty-state">
          <p className="lead-text">配置服务密钥后，这里会出现最近任务与结果入口。</p>
          <Link to="/key-center" className="button-link button-link-secondary">
            去配置密钥
          </Link>
        </div>
      ) : null}

      {apiKey.trim() && loading ? <p className="lead-text">正在读取最近任务...</p> : null}
      {apiKey.trim() && errorMessage ? <p className="lead-text">{errorMessage}</p> : null}

      {apiKey.trim() && !loading && !errorMessage && tasks.length === 0 ? (
        <div className="empty-state">
          <p className="muted-text">还没有任务记录，建议从“一键彩平”或“毛坯转效果”开始。</p>
          <Link to="/workspace/color-plan" className="button-link button-link-primary">
            进入默认工作台
          </Link>
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <div className="recent-task-list">
          {tasks.map((task) => (
            <article key={task.taskId} className="recent-task-item">
              <div>
                <strong>{task.displayName}</strong>
                <p className="muted-text">
                  {task.taskId} · {formatSubmittedAt(task.submittedAt)}
                </p>
              </div>
              <div className="recent-task-actions">
                <span className="glass-chip">{task.status}</span>
                <Link to={`/workspace/${task.appSlug}`} className="inline-link">
                  继续查看
                </Link>
              </div>
            </article>
          ))}
          <Link to="/tasks" className="inline-link">
            查看全部任务
          </Link>
        </div>
      ) : null}
    </AcrylicCard>
  );
}
