"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { ResultPanel } from "@/components/workspace/result-panel";
import { useTaskStore, type TaskInfo } from "@/lib/stores/task-store";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskHistoryItem } from "@/lib/types";

interface AppDetail {
  id: string;
  name: string;
  description: string;
  icon: string;
  rhAppId: string;
  fields: Array<{
    id: string;
    nodeId: string;
    fieldName: string;
    fieldType: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue: string | null;
    options: string | null;
    sortOrder: number;
  }>;
}

export default function WorkspaceAppPage() {
  const params = useParams();
  const appId = params.appId as string;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [historyResult, setHistoryResult] = useState<TaskHistoryItem | null>(null);

  // 从 store 获取当前任务信息
  const currentTask = useTaskStore((s) =>
    currentTaskId ? s.getTask(currentTaskId) ?? null : null
  );

  useEffect(() => {
    fetch(`/api/apps/${appId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApp(data.data);
        } else {
          setError(data.error || "应用不存在");
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [appId]);

  const handleTaskCreated = useCallback((taskId: string) => {
    setCurrentTaskId(taskId);
    setHistoryResult(null);
  }, []);

  const handleRetry = useCallback(() => {
    setCurrentTaskId(null);
    setHistoryResult(null);
  }, []);

  const handleSelectHistoryTask = useCallback((task: TaskHistoryItem) => {
    setCurrentTaskId(null);
    setHistoryResult(task);
  }, []);

  // 将历史记录转换为 TaskInfo 格式用于展示
  const displayTask: TaskInfo | null = currentTask
    ? currentTask
    : historyResult
      ? {
          taskId: historyResult.taskId,
          appId: historyResult.appId,
          appName: historyResult.appName,
          status: historyResult.status,
          startedAt: historyResult.createdAt instanceof Date
            ? historyResult.createdAt.getTime()
            : new Date(historyResult.createdAt).getTime(),
          outputs: historyResult.outputs
            ? (historyResult.outputs as { files?: Array<{ fileUrl: string; fileType: string }> }).files ?? null
            : null,
        }
      : null;

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-12" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground">{error || "应用不存在"}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 应用标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{app.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{app.name}</h1>
            <p className="text-sm text-muted-foreground">{app.description}</p>
          </div>
        </div>
      </div>

      {/* 左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左栏：输入表单 (40%) */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border p-4">
            <WorkspaceForm
              appId={app.id}
              appName={app.name}
              fields={app.fields}
              onTaskCreated={handleTaskCreated}
            />
          </div>
        </div>

        {/* 右栏：结果展示 (60%) */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border p-4">
            <ResultPanel
              appId={app.id}
              currentTask={displayTask}
              onRetry={handleRetry}
              onSelectHistoryTask={handleSelectHistoryTask}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
