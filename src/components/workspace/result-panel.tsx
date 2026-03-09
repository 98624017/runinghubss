"use client";

import { Download, RefreshCw, AlertTriangle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "./task-status-badge";
import { RecentTasks } from "./recent-tasks";
import type { TaskInfo } from "@/lib/stores/task-store";
import type { TaskHistoryItem } from "@/lib/types";
import type { TaskStatus } from "@/lib/constants";

interface ResultPanelProps {
  appId: string;
  currentTask: TaskInfo | null;
  onRetry: () => void;
  onSelectHistoryTask: (task: TaskHistoryItem) => void;
}

export function ResultPanel({
  appId,
  currentTask,
  onRetry,
  onSelectHistoryTask,
}: ResultPanelProps) {
  const handleDownload = async (url: string, index: number) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `result-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // 降级：直接打开链接
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* 当前任务状态 */}
      {currentTask && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">当前任务</h3>
            <TaskStatusBadge status={currentTask.status} />
          </div>

          {/* 生成结果 */}
          {currentTask.status === "SUCCESS" && currentTask.outputs && (
            <div className="space-y-3">
              {currentTask.outputs.map((output, i) => (
                <div key={i} className="space-y-2">
                  <div className="relative rounded-lg border overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={output.fileUrl}
                      alt={`生成结果 ${i + 1}`}
                      className="w-full object-contain max-h-[500px]"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownload(output.fileUrl, i)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载结果 {currentTask.outputs!.length > 1 ? i + 1 : ""}
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                结果链接有时效性，请及时下载保存
              </p>
            </div>
          )}

          {/* 运行中 */}
          {(currentTask.status === "RUNNING" || currentTask.status === "QUEUED") && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-sm">
                {currentTask.status === "QUEUED" ? "等待服务器处理..." : "AI 正在生成中..."}
              </p>
              <p className="text-xs mt-1">请耐心等待，通常需要 30-120 秒</p>
            </div>
          )}

          {/* 失败 */}
          {currentTask.status === "FAILED" && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm text-destructive mb-1">生成失败</p>
              <p className="text-xs mb-4">{currentTask.error || "未知错误，请重试"}</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!currentTask && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">填写左侧表单，开始 AI 生成</p>
        </div>
      )}

      {/* 最近记录 */}
      <RecentTasks appId={appId} onSelectTask={onSelectHistoryTask} />
    </div>
  );
}
