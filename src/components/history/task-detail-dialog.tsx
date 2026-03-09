"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskStatusBadge } from "@/components/workspace/task-status-badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { TaskHistoryItem } from "@/lib/types";
import type { TaskStatus } from "@/lib/constants";

interface TaskDetailDialogProps {
  task: TaskHistoryItem | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailDialog({ task, open, onClose }: TaskDetailDialogProps) {
  if (!task) return null;

  const outputs = task.outputs as { files?: Array<{ fileUrl: string; fileType: string }> } | null;
  const files = outputs?.files ?? [];

  const createdAt = task.createdAt instanceof Date
    ? task.createdAt
    : new Date(task.createdAt);

  const completedAt = task.completedAt
    ? task.completedAt instanceof Date
      ? task.completedAt
      : new Date(task.completedAt)
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            任务详情
            <TaskStatusBadge status={task.status as TaskStatus} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">应用：</span>
              <span>{task.appName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">任务 ID：</span>
              <span className="font-mono text-xs">{task.taskId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">创建时间：</span>
              <span>{createdAt.toLocaleString("zh-CN")}</span>
            </div>
            {completedAt && (
              <div>
                <span className="text-muted-foreground">完成时间：</span>
                <span>{completedAt.toLocaleString("zh-CN")}</span>
              </div>
            )}
          </div>

          {/* 输入快照 */}
          {task.inputs && Object.keys(task.inputs).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">输入参数</h4>
              <div className="rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(task.inputs, null, 2)}
              </div>
            </div>
          )}

          {/* 结果 */}
          {files.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">生成结果</h4>
              <div className="space-y-3">
                {files.map((file, i) => (
                  <div key={i} className="space-y-2">
                    <div className="rounded-lg border overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.fileUrl}
                        alt={`结果 ${i + 1}`}
                        className="w-full object-contain max-h-[400px]"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.fileUrl, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
