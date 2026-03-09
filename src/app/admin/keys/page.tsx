"use client";

import { useEffect, useState } from "react";
import { adminApiClient } from "@/lib/admin-api-client";
import { Button } from "@/components/ui/button";
import { KeyMultiplierForm } from "@/components/admin/key-multiplier-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface KeyItem {
  id: string;
  apiKeyHash: string;
  apiKeyMasked: string;
  multiplier: number;
  remark: string | null;
  createdAt: string;
}

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const loadKeys = async () => {
    const result = await adminApiClient<KeyItem[]>("/api/admin/keys");
    if (result.success && result.data) {
      setKeys(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("确定删除该 Key 倍率配置？");
    if (!confirmed) return;

    const result = await adminApiClient(`/api/admin/keys/${id}`, {
      method: "DELETE",
    });

    if (result.success) {
      toast.success("已删除");
      loadKeys();
    } else {
      toast.error(result.error || "删除失败");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Key 倍率管理</h1>
          <p className="text-sm text-muted-foreground">
            为特定 API Key 设置计费倍率
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加倍率
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : keys.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          暂无自定义倍率配置，所有 Key 使用全局默认倍率
        </p>
      ) : (
        <div className="rounded-lg border">
          <div className="hidden sm:grid grid-cols-[1fr_auto_1fr_auto_auto] gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>API Key</span>
            <span>倍率</span>
            <span>备注</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>
          {keys.map((key) => (
            <div
              key={key.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_auto] gap-2 sm:gap-4 items-center px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors text-sm"
            >
              <span className="font-mono text-xs">{key.apiKeyMasked}</span>
              <span className="font-medium">{key.multiplier}x</span>
              <span className="text-muted-foreground text-xs">
                {key.remark || "-"}
              </span>
              <span className="text-muted-foreground text-xs">
                {new Date(key.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(key.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <KeyMultiplierForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadKeys}
      />
    </div>
  );
}
