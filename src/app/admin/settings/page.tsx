"use client";

import { useEffect, useState } from "react";
import { adminApiClient } from "@/lib/admin-api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Settings {
  siteName: string;
  defaultMultiplier: string;
  webhookEnabled: string;
  webhookUrl: string;
  maxUploadSize: string;
  maxConcurrentTasks: string;
}

const KNOWN_SETTINGS_KEYS: ReadonlySet<string> = new Set([
  "siteName",
  "defaultMultiplier",
  "webhookEnabled",
  "webhookUrl",
  "maxUploadSize",
  "maxConcurrentTasks",
]);

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: "悦安居",
    defaultMultiplier: "1",
    webhookEnabled: "false",
    webhookUrl: "",
    maxUploadSize: "10485760",
    maxConcurrentTasks: "30",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApiClient<Array<{ key: string; value: string }>>("/api/admin/settings")
      .then((result) => {
        if (result.success && result.data) {
          const map: Record<string, string> = {};
          for (const item of result.data) {
            // 只读取已知的 key，避免垃圾数据污染 state
            if (KNOWN_SETTINGS_KEYS.has(item.key)) {
              map[item.key] = item.value;
            }
          }
          setSettings((prev) => ({ ...prev, ...map }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await adminApiClient("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      if (result.success) {
        toast.success("设置已保存");
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">系统设置</h1>

      <div className="max-w-xl space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">站点名称</label>
          <Input
            value={settings.siteName}
            onChange={(e) => updateSetting("siteName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">全局默认倍率</label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={settings.defaultMultiplier}
            onChange={(e) => updateSetting("defaultMultiplier", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            未单独配置倍率的 Key 将使用此默认值
          </p>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Webhook 通知</label>
              <p className="text-xs text-muted-foreground">任务完成后发送通知</p>
            </div>
            <Switch
              checked={settings.webhookEnabled === "true"}
              onCheckedChange={(v) => updateSetting("webhookEnabled", String(v))}
            />
          </div>
          {settings.webhookEnabled === "true" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Webhook URL</label>
              <Input
                placeholder="https://example.com/webhook"
                value={settings.webhookUrl}
                onChange={(e) => updateSetting("webhookUrl", e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">最大上传大小 (bytes)</label>
            <Input
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) => updateSetting("maxUploadSize", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {(parseInt(settings.maxUploadSize) / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">最大并发任务数</label>
            <Input
              type="number"
              value={settings.maxConcurrentTasks}
              onChange={(e) => updateSetting("maxConcurrentTasks", e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          保存设置
        </Button>
      </div>
    </div>
  );
}
