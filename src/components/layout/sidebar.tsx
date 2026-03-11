"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icon-map";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";
import { useTaskStore } from "@/lib/stores/task-store";

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

type AppTaskStatus = "success" | "running" | "failed" | null;

function getAppTaskStatus(
  appId: string,
  activeTasks: Map<string, { appId: string; status: string }>
): AppTaskStatus {
  let hasRunning = false;
  let hasSuccess = false;

  for (const task of activeTasks.values()) {
    if (task.appId !== appId) continue;

    if (task.status === "FAILED") return "failed";
    if (task.status === "RUNNING" || task.status === "QUEUED") hasRunning = true;
    if (task.status === "SUCCESS") hasSuccess = true;
  }

  if (hasRunning) return "running";
  if (hasSuccess) return "success";
  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const [apps, setApps] = useState<AppItem[]>([]);
  const activeTasks = useTaskStore((s) => s.activeTasks);

  // 缓存所有应用的任务状态映射，避免每次 render 遍历 activeTasks
  const appStatusMap = useMemo(() => {
    const map = new Map<string, AppTaskStatus>();
    for (const app of apps) {
      map.set(app.id, getAppTaskStatus(app.id, activeTasks));
    }
    return map;
  }, [apps, activeTasks]);

  useEffect(() => {
    fetch("/api/apps")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setApps(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-muted/30">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          AI 应用
        </h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {apps.map((app) => {
            const Icon = getIcon(app.icon);
            const isActive = pathname === `/workspace/${app.id}`;
            const taskStatus = appStatusMap.get(app.id) ?? null;
            return (
              <Link
                key={app.id}
                href={`/workspace/${app.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary font-medium"
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {taskStatus && (
                    <span
                      className={cn(
                        "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                        taskStatus === "success" && "bg-green-500",
                        taskStatus === "running" && "bg-amber-500 animate-pulse",
                        taskStatus === "failed" && "bg-destructive"
                      )}
                    />
                  )}
                </div>
                <span className="truncate">{app.name}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
