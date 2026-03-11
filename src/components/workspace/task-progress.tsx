"use client";

import { useState, useEffect } from "react";
import type { TaskInfo } from "@/lib/stores/task-store";

interface TaskProgressProps {
  task: TaskInfo;
  avgDuration: number | null; // 毫秒，null 表示无历史数据
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds} 秒`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} 分 ${seconds} 秒`;
}

export function TaskProgress({ task, avgDuration }: TaskProgressProps) {
  const [elapsed, setElapsed] = useState(() => Date.now() - task.startedAt);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - task.startedAt);
    }, 1000);

    return () => clearInterval(timer);
  }, [task.startedAt]);

  const isRunning = task.status === "RUNNING";
  const isQueued = task.status === "QUEUED";

  const hasAvgDuration = avgDuration !== null && avgDuration > 0;
  const isOvertime = hasAvgDuration && elapsed > avgDuration;
  const progressPercent =
    hasAvgDuration && isRunning
      ? Math.min(95, Math.round((elapsed / avgDuration) * 100))
      : 0;
  const remaining = hasAvgDuration ? avgDuration - elapsed : 0;

  const estimateText = (() => {
    if (!hasAvgDuration || !isRunning) return null;
    if (isOvertime) {
      return (
        <span className="text-amber-500">
          比平时耗时更长，请继续等待
        </span>
      );
    }
    if (remaining > 60_000) {
      return `预计还需约 ${Math.ceil(remaining / 60_000)} 分钟`;
    }
    return `预计还需约 ${Math.max(1, Math.round(remaining / 1000))} 秒`;
  })();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      {/* 旋转加载动画 */}
      <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />

      {/* 状态文本 */}
      <p className="text-sm">
        {isQueued ? "等待服务器处理..." : "AI 正在生成中..."}
      </p>

      {/* 已耗时 */}
      <p className="text-xs mt-1">
        已耗时 {formatDuration(elapsed)}
      </p>

      {/* 进度条（仅在有历史数据且正在运行时显示） */}
      {hasAvgDuration && isRunning && (
        <div className="w-full max-w-xs mt-4 space-y-1.5">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isOvertime ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {estimateText && (
            <p className="text-xs text-center">{estimateText}</p>
          )}
        </div>
      )}

      {/* 无历史数据时的默认提示 */}
      {!hasAvgDuration && (
        <p className="text-xs mt-1">通常需要 30-120 秒</p>
      )}
    </div>
  );
}
