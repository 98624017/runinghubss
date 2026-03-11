"use client";

import { TaskList } from "@/components/history/task-list";
import { AppShell } from "@/components/layout/app-shell";

export default function HistoryPage() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">生成历史</h1>
          <p className="text-muted-foreground">
            查看所有 AI 生成任务的历史记录
          </p>
        </div>
        <TaskList />
      </div>
    </AppShell>
  );
}
