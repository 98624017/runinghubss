"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ListChecks,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTaskStore, type TaskInfo } from "@/lib/stores/task-store";

/* ------------------------------------------------------------------ */
/*  状态 → 图标 / 颜色 / 文本 映射                                      */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  TaskInfo["status"],
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  QUEUED: { icon: Clock, color: "text-muted-foreground", label: "排队中" },
  RUNNING: { icon: Loader2, color: "text-amber-500", label: "运行中" },
  SUCCESS: { icon: CheckCircle2, color: "text-green-500", label: "已完成" },
  FAILED: { icon: XCircle, color: "text-destructive", label: "失败" },
};

/* ------------------------------------------------------------------ */
/*  时间格式化                                                          */
/* ------------------------------------------------------------------ */

function formatElapsed(startedAt: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
}

/* ------------------------------------------------------------------ */
/*  TaskElapsed — 独立计时组件，避免整个 TaskPanel 每秒重渲染              */
/* ------------------------------------------------------------------ */

function TaskElapsed({ startedAt, isActive }: { startedAt: number; isActive: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  return <>{formatElapsed(startedAt, now)}</>;
}

/* ------------------------------------------------------------------ */
/*  TaskPanel                                                          */
/* ------------------------------------------------------------------ */

export function TaskPanel() {
  // 细粒度选择器：只提取序列化后的任务列表，避免 Map 引用变化导致重渲染
  const taskList = useTaskStore((s) => {
    const tasks = Array.from(s.activeTasks.values());
    return tasks.sort((a, b) => b.startedAt - a.startedAt);
  });

  // 进行中任务数量（QUEUED + RUNNING）
  const pendingCount = useMemo(
    () => taskList.filter((t) => t.status === "QUEUED" || t.status === "RUNNING").length,
    [taskList]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <ListChecks className="h-5 w-5" />
        {pendingCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
          >
            {pendingCount}
          </Badge>
        )}
        <span className="sr-only">任务队列</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* 顶部标题区 */}
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-4 py-3">
            <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
              任务队列
            </DropdownMenuLabel>
            <span className="text-xs text-muted-foreground">
              {pendingCount > 0
                ? `${pendingCount} 个进行中`
                : "无进行中任务"}
            </span>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="m-0" />

        {/* 任务列表 */}
        {taskList.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            暂无任务
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="flex flex-col">
              {taskList.map((task) => {
                const config = STATUS_CONFIG[task.status];
                const StatusIcon = config.icon;
                const isActive = task.status === "QUEUED" || task.status === "RUNNING";

                return (
                  <DropdownMenuItem key={task.taskId} className="p-0">
                    <Link
                      href={`/workspace/${task.appId}`}
                      className="flex w-full items-center gap-3 px-4 py-2.5"
                    >
                      <StatusIcon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          config.color,
                          task.status === "RUNNING" && "animate-spin"
                        )}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">
                          {task.appName}
                        </span>
                        <span
                          className={cn("text-xs", config.color)}
                        >
                          {config.label} &middot;{" "}
                          <TaskElapsed startedAt={task.startedAt} isActive={isActive} />
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DropdownMenuSeparator className="m-0" />

        {/* 底部链接 */}
        <DropdownMenuItem className="p-0">
          <Link
            href="/history"
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <History className="h-4 w-4" />
            查看全部历史
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
