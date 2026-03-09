"use client";

import { useEffect, useState } from "react";
import { getTaskHistoryByApp } from "@/lib/db";
import { hashApiKey } from "@/lib/utils/crypto";
import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { TaskStatusBadge } from "./task-status-badge";
import type { TaskHistoryItem } from "@/lib/types";
import type { TaskStatus } from "@/lib/constants";

interface RecentTasksProps {
  appId: string;
  onSelectTask: (task: TaskHistoryItem) => void;
}

export function RecentTasks({ appId, onSelectTask }: RecentTasksProps) {
  const [tasks, setTasks] = useState<TaskHistoryItem[]>([]);
  const apiKey = useApiKeyStore((s) => s.apiKey);

  useEffect(() => {
    if (!apiKey) return;

    const load = async () => {
      const hash = hashApiKey(apiKey);
      const records = await getTaskHistoryByApp(hash, appId);
      setTasks(records.slice(0, 10));
    };

    load();

    // 每 5 秒刷新一次
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [apiKey, appId]);

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">最近生成记录</h3>
      <div className="space-y-1">
        {tasks.map((task) => (
          <button
            key={task.taskId}
            className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            onClick={() => onSelectTask(task)}
          >
            <span className="text-muted-foreground truncate mr-2">
              {task.createdAt instanceof Date
                ? task.createdAt.toLocaleString("zh-CN")
                : new Date(task.createdAt).toLocaleString("zh-CN")}
            </span>
            <TaskStatusBadge status={task.status as TaskStatus} />
          </button>
        ))}
      </div>
    </div>
  );
}
