"use client";

import { useState } from "react";
import { Download, RefreshCw, AlertTriangle, ImageIcon, SplitSquareVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskProgress } from "./task-progress";
import { RecentTasks } from "./recent-tasks";
import { CompareView } from "./compare-view";
import type { TaskInfo } from "@/lib/stores/task-store";
import type { TaskHistoryItem } from "@/lib/types";

interface ResultPanelProps {
  appId: string;
  currentTask: TaskInfo | null;
  onRetry: (inputs?: Record<string, string>) => void;
  onSelectHistoryTask: (task: TaskHistoryItem) => void;
  avgDuration?: number | null;
  originalImageUrl?: string;
}

export function ResultPanel({
  appId,
  currentTask,
  onRetry,
  onSelectHistoryTask,
  avgDuration,
  originalImageUrl,
}: ResultPanelProps) {
  const [compareIndex, setCompareIndex] = useState<number | null>(null);
  const handleDownload = async (url: string, index: number, fileType?: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = fileType?.split("/")[1] || "png";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `result-${index + 1}.${ext}`;
      a.click();
      // 延迟回收，确保浏览器有时间开始下载
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
                  {compareIndex === i && originalImageUrl ? (
                    <CompareView beforeImage={originalImageUrl} afterImage={output.fileUrl} />
                  ) : (
                    <div className="relative rounded-lg border overflow-hidden bg-muted">
                      <Image
                        src={output.fileUrl}
                        alt={`生成结果 ${i + 1}`}
                        width={800}
                        height={500}
                        className="w-full object-contain max-h-[500px]"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(output.fileUrl, i, output.fileType)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下载结果 {currentTask.outputs!.length > 1 ? i + 1 : ""}
                    </Button>
                    {originalImageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareIndex(compareIndex === i ? null : i)}
                      >
                        <SplitSquareVertical className="h-4 w-4 mr-2" />
                        {compareIndex === i ? "退出对比" : "对比原图"}
                      </Button>
                    )}
                  </div>
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
            <TaskProgress task={currentTask} avgDuration={avgDuration ?? null} />
          )}

          {/* 失败 */}
          {currentTask.status === "FAILED" && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm text-destructive mb-1">生成失败</p>
              <p className="text-xs mb-4">{currentTask.error || "未知错误，请重试"}</p>
              <Button variant="outline" size="sm" onClick={() => onRetry(currentTask.inputs)}>
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
