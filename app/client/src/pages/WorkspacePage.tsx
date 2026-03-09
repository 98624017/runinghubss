import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AcrylicCard } from '../components/AcrylicCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { findAppBySlug } from '../features/apps/appsConfig';
import { createInitialFormValues, hasRequiredFieldsReady } from '../features/apps/formState';
import { ResultPanel } from '../features/tasks/ResultPanel';
import { TaskStatusCard } from '../features/tasks/TaskStatusCard';
import { useTaskRunner } from '../features/tasks/useTaskRunner';
import { SchemaRenderer } from '../features/workspace/schemaRenderer';
import { WorkspaceShell } from '../features/workspace/WorkspaceShell';
import { usePublicAppContext } from '../router';

function getPhaseLabel(phase: 'idle' | 'submitting' | 'running' | 'succeeded' | 'failed') {
  switch (phase) {
    case 'submitting':
      return '正在提交任务';
    case 'running':
      return '任务运行中';
    case 'succeeded':
      return '运行完成';
    case 'failed':
      return '执行失败';
    default:
      return '等待提交';
  }
}

export function WorkspacePage() {
  const { slug = '' } = useParams();
  const { apps, apiKey, site } = usePublicAppContext();
  const app = findAppBySlug(apps, slug);
  const taskRunner = useTaskRunner(app?.id ?? '');
  const [formValues, setFormValues] = useState(() => (app ? createInitialFormValues(app) : {}));
  const floatingAnchorRef = useRef<HTMLDivElement | null>(null);
  const [floatingActionStyle, setFloatingActionStyle] = useState({
    left: 328,
    width: 296,
  });

  useLayoutEffect(() => {
    if (app) {
      setFormValues(createInitialFormValues(app));
    }
  }, [app]);

  useLayoutEffect(() => {
    function syncFloatingActionPosition() {
      const anchor = floatingAnchorRef.current;
      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const isCompactViewport = window.innerWidth <= 720;
      const nextLeft = isCompactViewport ? 18 : Math.max(18, rect.left);
      const nextWidth = isCompactViewport
        ? Math.max(220, window.innerWidth - 36)
        : Math.min(320, Math.max(240, rect.width - 8));

      setFloatingActionStyle({
        left: Math.round(nextLeft),
        width: Math.round(nextWidth),
      });
    }

    syncFloatingActionPosition();
    window.addEventListener('resize', syncFloatingActionPosition);

    return () => {
      window.removeEventListener('resize', syncFloatingActionPosition);
    };
  }, [app?.slug]);

  const canRun = useMemo(() => {
    if (!app) {
      return false;
    }
    return Boolean(apiKey.trim()) && hasRequiredFieldsReady(app, formValues);
  }, [apiKey, app, formValues]);

  async function handleRun() {
    if (!app || !canRun) {
      return;
    }

    await taskRunner.run({
      apiKey: apiKey.trim(),
      formValues,
    });
  }

  if (!app) {
    return (
      <AcrylicCard eyebrow="Workspace" title="工作区">
        <p className="lead-text">未找到对应应用，请返回控制台重新选择。</p>
        <Link to="/" className="inline-link">
          返回控制台
        </Link>
      </AcrylicCard>
    );
  }

  return (
    <div className="page-stack workspace-page">
      <header className="page-header">
        <p className="hero-kicker">Workspace</p>
        <h2>{app.title}</h2>
        <p className="lead-text">{app.description}</p>
      </header>

      <WorkspaceShell
        main={
          <div className="workspace-stage-grid">
            <div ref={floatingAnchorRef} className="workspace-stage-main">
              <SchemaRenderer app={app} value={formValues} onChange={setFormValues} />
            </div>

            <div className="workspace-stage-results">
              <ResultPanel
                result={taskRunner.resultPayload}
                emptyLabel="运行完成后，这里会展示输出图像、耗时与结果下载入口。"
                notice={site.resultLinkNotice}
                historyHref={`/tasks?appSlug=${encodeURIComponent(app.slug)}`}
                rerunHref={`/workspace/${app.slug}`}
              />
            </div>
          </div>
        }
        support={
          <div className="workspace-support-stack">
            <TaskStatusCard
              phase={taskRunner.phase}
              taskId={taskRunner.taskId}
              message={taskRunner.errorMessage ?? getPhaseLabel(taskRunner.phase)}
            />
          </div>
        }
      />

      <div
        className="workspace-floating-action"
        style={{
          left: `${floatingActionStyle.left}px`,
          width: `${floatingActionStyle.width}px`,
        }}
      >
        <PrimaryButton
          type="button"
          className="workspace-floating-action-button"
          onClick={() => void handleRun()}
          disabled={!canRun || taskRunner.phase === 'submitting' || taskRunner.phase === 'running'}
          title={
            !apiKey.trim()
              ? '请先在密钥管理中配置服务密钥'
              : canRun
                ? '开始生成'
                : '请先完成必填素材和参数'
          }
        >
          {taskRunner.phase === 'submitting' || taskRunner.phase === 'running'
            ? '开始生成中...'
            : '开始生成'}
        </PrimaryButton>
      </div>
    </div>
  );
}
