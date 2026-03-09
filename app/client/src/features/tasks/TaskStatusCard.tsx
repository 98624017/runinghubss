import { AcrylicCard } from '../../components/AcrylicCard';
import { StatusBadge } from '../../components/StatusBadge';

type TaskStatusCardProps = {
  phase: 'idle' | 'submitting' | 'running' | 'succeeded' | 'failed';
  taskId: string | null;
  message: string;
};

const phaseToTone = {
  idle: 'neutral',
  submitting: 'info',
  running: 'info',
  succeeded: 'success',
  failed: 'error',
} as const;

const phaseToBadgeLabel = {
  idle: '待提交',
  submitting: '提交中',
  running: '执行中',
  succeeded: '已完成',
  failed: '已失败',
} as const;

export function TaskStatusCard({ phase, taskId, message }: TaskStatusCardProps) {
  return (
    <AcrylicCard
      eyebrow="Task"
      title="任务状态"
      actions={<StatusBadge tone={phaseToTone[phase]} label={phaseToBadgeLabel[phase]} />}
    >
      <div className="status-card-body">
        <div className="status-hero">
          <div className={`status-orb phase-${phase}`} />
          <div>
            <strong>{message}</strong>
            <p>当前任务会自动轮询，无需手动刷新页面。</p>
          </div>
        </div>
        <div className="task-meta">
          <span>任务编号</span>
          <code>{taskId ?? '尚未创建'}</code>
        </div>
      </div>
    </AcrylicCard>
  );
}
