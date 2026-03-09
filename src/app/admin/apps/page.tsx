"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApiClient } from "@/lib/admin-api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AppItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  sortOrder: number;
  enabled: boolean;
  _count?: { fields: number };
}

export default function AdminAppsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApps = async () => {
    const result = await adminApiClient<AppItem[]>("/api/admin/apps");
    if (result.success && result.data) {
      setApps(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`确定删除应用「${name}」？此操作不可恢复。`);
    if (!confirmed) return;

    const result = await adminApiClient(`/api/admin/apps/${id}`, {
      method: "DELETE",
    });

    if (result.success) {
      toast.success("已删除");
      loadApps();
    } else {
      toast.error(result.error || "删除失败");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">应用管理</h1>
        <Link href="/admin/apps/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建应用
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : apps.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">暂无应用</p>
      ) : (
        <div className="rounded-lg border">
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>图标</span>
            <span>名称</span>
            <span>分类</span>
            <span>排序</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          {apps.map((app) => (
            <div
              key={app.id}
              className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-4 items-center px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors"
            >
              <span className="text-2xl">{app.icon}</span>
              <div>
                <span className="font-medium text-sm">{app.name}</span>
                {app._count && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({app._count.fields} 个字段)
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{app.category}</span>
              <span className="text-xs text-muted-foreground">{app.sortOrder}</span>
              <Badge variant={app.enabled ? "default" : "secondary"}>
                {app.enabled ? "启用" : "禁用"}
              </Badge>
              <div className="flex items-center gap-1">
                <Link href={`/admin/apps/${app.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(app.id, app.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
