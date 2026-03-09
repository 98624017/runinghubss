"use client";

import { useEffect, useState } from "react";
import { AppCard } from "@/components/workspace/app-card";
import { Skeleton } from "@/components/ui/skeleton";

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function WorkspacePage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apps")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setApps(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">工作台</h1>
        <p className="text-muted-foreground">选择一个 AI 应用开始创作</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {apps.map((app) => (
            <AppCard key={app.id} {...app} />
          ))}
        </div>
      )}
    </div>
  );
}
