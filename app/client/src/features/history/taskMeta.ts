import type { HistoryTaskStatus } from '../../types';

export const STATUS_OPTIONS: Array<{ value: HistoryTaskStatus | ''; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'queued', label: '排队中' },
  { value: 'submitted', label: '已提交' },
  { value: 'running', label: '运行中' },
  { value: 'succeeded', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'timeout', label: '超时' },
  { value: 'cancelled', label: '已取消' },
];

export function formatStatusLabel(status: string) {
  const match = STATUS_OPTIONS.find((item) => item.value === status);
  return match?.label ?? '未知状态';
}

export function formatSubmittedAt(value: string) {
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
