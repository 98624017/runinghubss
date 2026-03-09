"use client";

import { useState, useEffect, useMemo } from "react";
import { getTaskHistory } from "@/lib/db";
import { hashApiKey } from "@/lib/utils/crypto";
import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { TaskStatusBadge } from "@/components/workspace/task-status-badge";
import { TaskDetailDialog } from "./task-detail-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import type { TaskHistoryItem } from "@/lib/types";
import type { TaskStatus } from "@/lib/constants";

export function TaskList() {
  const [tasks, setTasks] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskHistoryItem | null>(null);
  const [filterApp, setFilterApp] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const apiKey = useApiKeyStore((s) => s.apiKey);

  const loadTasks = async () => {
    if (!apiKey) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      const hash = hashApiKey(apiKey);
      const records = await getTaskHistory(hash);
      setTasks(records);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // 提取去重的应用列表
  const appNames = useMemo(() => {
    const names = new Set(tasks.map((t) => t.appName));
    return Array.from(names);
  }, [tasks]);

  // 过滤
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterApp !== "all" && t.appName !== filterApp) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterApp, filterStatus]);

  const handleClearAll = async () => {
    if (!apiKey) return;
    const confirmed = window.confirm("确定清除所有历史记录？此操作不可恢复。");
    if (!confirmed) return;

    try {
      const hash = hashApiKey(apiKey);
      await db.taskHistory.where("apiKeyHash").equals(hash).delete();
      setTasks([]);
      toast.success("历史记录已清除");
    } catch {
      toast.error("清除失败");
    }
  };

  if (!apiKey) {
    return (
      <p className="text-center text-muted-foreground py-12">
        请先在设置中配置 API Key 以查看历史记录
      </p>
    );
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">加载中...</p>;
  }

  return (
    <div className="space-y-4">
      {/* 过滤器与操作 */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterApp} onValueChange={(v) => setFilterApp(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="全部应用" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部应用</SelectItem>
            {appNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="SUCCESS">已完成</SelectItem>
            <SelectItem value="FAILED">失败</SelectItem>
            <SelectItem value="RUNNING">运行中</SelectItem>
            <SelectItem value="QUEUED">排队中</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {tasks.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-1" />
            清除历史
          </Button>
        )}
      </div>

      {/* 任务列表 */}
      {filteredTasks.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">暂无记录</p>
      ) : (
        <div className="rounded-lg border">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>应用</span>
            <span>时间</span>
            <span>状态</span>
            <span>任务 ID</span>
            <span>操作</span>
          </div>
          {filteredTasks.map((task) => {
            const createdAt = task.createdAt instanceof Date
              ? task.createdAt
              : new Date(task.createdAt);

            return (
              <div
                key={task.taskId}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-4 items-center px-4 py-3 border-b last:border-b-0 text-sm hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium">{task.appName}</span>
                <span className="text-muted-foreground text-xs">
                  {createdAt.toLocaleString("zh-CN")}
                </span>
                <TaskStatusBadge status={task.status as TaskStatus} />
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                  {task.taskId}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedTask(task)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* 详情弹窗 */}
      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
