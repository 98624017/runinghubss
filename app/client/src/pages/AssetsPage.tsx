import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AcrylicCard } from '../components/AcrylicCard';
import { formatSubmittedAt } from '../features/history/taskMeta';
import { useHistoryFeed } from '../features/history/useHistoryFeed';
import { usePublicAppContext } from '../router';

function buildSearchParams(appSlug: string) {
  const nextParams = new URLSearchParams();
  if (appSlug) {
    nextParams.set('appSlug', appSlug);
  }
  return nextParams;
}

export function AssetsPage() {
  const { apiKey, apps } = usePublicAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAppSlug, setSelectedAppSlug] = useState(() => searchParams.get('appSlug') ?? '');
  const { tasks, loading, errorMessage } = useHistoryFeed({
    apiKey,
    appSlug: selectedAppSlug,
    status: 'succeeded',
  });

  const assets = useMemo(
    () =>
      tasks.flatMap((task) =>
        task.outputUrls.map((fileUrl, index) => ({
          id: `${task.taskId}-${index}`,
          taskId: task.taskId,
          fileUrl,
          assetIndex: index + 1,
          displayName: task.displayName,
          appSlug: task.appSlug,
          submittedAt: task.submittedAt,
          linkExpiryReminder: task.linkExpiryReminder,
        })),
      ),
    [tasks],
  );

  function handleAppChange(nextAppSlug: string) {
    setSelectedAppSlug(nextAppSlug);
    setSearchParams(buildSearchParams(nextAppSlug), { replace: true });
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Assets</p>
        <h2>成果资产索引</h2>
        <p className="lead-text">集中查看已完成结果，把临时生成链接转化为可下载、可复用的项目资产。</p>
      </header>

      <AcrylicCard eyebrow="Asset Index" title="已完成结果">
        {apiKey.trim() ? (
          <div className="history-panel">
            <div className="history-filter-grid single">
              <label className="field-stack" htmlFor="asset-app-filter">
                <span>应用筛选</span>
                <select
                  id="asset-app-filter"
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
            </div>

            {loading ? <p className="lead-text">正在同步资产索引...</p> : null}
            {errorMessage ? <p className="lead-text">{errorMessage}</p> : null}

            {!loading && !errorMessage && assets.length === 0 ? (
              <div className="empty-state">
                <p className="lead-text">当前筛选条件下还没有可展示结果，请先完成一次生成任务。</p>
                <Link
                  to={apps[0] ? `/workspace/${apps[0].slug}` : '/'}
                  className="button-link button-link-secondary"
                >
                  打开工作台
                </Link>
              </div>
            ) : null}

            {!loading && !errorMessage && assets.length > 0 ? (
              <div className="asset-grid">
                {assets.map((asset) => (
                  <article key={asset.id} className="asset-card">
                    <img
                      src={asset.fileUrl}
                      alt={`${asset.displayName} 资产 ${asset.assetIndex}`}
                      className="asset-preview"
                    />
                    <div className="asset-card-body">
                      <div className="history-title-group">
                        <h3>{asset.displayName}</h3>
                        <p className="muted-text">提交时间：{formatSubmittedAt(asset.submittedAt)}</p>
                      </div>
                      <div className="result-actions">
                        <a href={asset.fileUrl} download className="result-action-link">
                          下载结果
                        </a>
                        <a
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="result-action-link"
                        >
                          打开原图
                        </a>
                        <Link to={`/workspace/${asset.appSlug}`} className="result-action-link">
                          再次生成
                        </Link>
                      </div>
                      <p className="field-note">{asset.linkExpiryReminder}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">
            <p className="lead-text">请先设置服务密钥，资产索引才能按你的归档视角展示。</p>
            <Link to="/key-center" className="button-link button-link-primary">
              去设置服务密钥
            </Link>
          </div>
        )}
      </AcrylicCard>
    </div>
  );
}
