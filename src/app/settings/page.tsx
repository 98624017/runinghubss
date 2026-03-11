"use client";

import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect, startTransition } from "react";
import { Bell, ImageIcon, KeyRound, Trash2, Volume2 } from "lucide-react";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { useImageSettingsStore } from "@/lib/stores/image-settings-store";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { apiKey, setApiKey, clearApiKey } = useApiKeyStore();
  const {
    desktopEnabled, soundEnabled, soundVolume,
    setDesktopEnabled, setSoundEnabled, setSoundVolume,
    requestPermission,
  } = useNotificationStore();
  const {
    autoWebP, defaultMaxDimension, defaultQuality,
    setAutoWebP, setDefaultMaxDimension, setDefaultQuality,
  } = useImageSettingsStore();
  const [inputKey, setInputKey] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
      setInputKey(apiKey);
    });
  }, [apiKey]);

  if (!mounted) return null;

  const handleSave = () => {
    if (!inputKey.trim()) {
      toast.error("请输入 API Key");
      return;
    }
    setApiKey(inputKey.trim());
    toast.success("API Key 已更新");
  };

  const handleClearKey = () => {
    clearApiKey();
    setInputKey("");
    toast.success("API Key 已清除");
  };

  const handleClearHistory = async () => {
    try {
      const { db } = await import("@/lib/db");
      await db.taskHistory.clear();
      toast.success("本地历史数据已清除");
    } catch {
      toast.error("清除历史数据失败");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="text-muted-foreground">管理你的 API Key 和本地数据</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              API Key 管理
            </CardTitle>
            <CardDescription>
              API Key 仅保存在浏览器本地，不会上传到服务器。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-api-key">API Key</Label>
              <Input
                id="settings-api-key"
                type="password"
                placeholder="请输入 API Key"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>保存</Button>
              <Button variant="outline" onClick={handleClearKey}>
                <Trash2 className="mr-2 h-4 w-4" />
                清除 Key
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知设置
            </CardTitle>
            <CardDescription>
              配置任务完成时的通知方式。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>桌面通知</Label>
                <p className="text-sm text-muted-foreground">
                  任务完成时发送浏览器桌面通知
                </p>
              </div>
              <Switch
                checked={desktopEnabled}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    const permission = await requestPermission();
                    if (permission === "granted") {
                      setDesktopEnabled(true);
                      toast.success("桌面通知已开启");
                    } else {
                      toast.error("桌面通知权限被拒绝，请在浏览器设置中允许通知");
                    }
                  } else {
                    setDesktopEnabled(false);
                  }
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  声音提醒
                </Label>
                <p className="text-sm text-muted-foreground">
                  任务完成时播放提示音
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            {soundEnabled && (
              <div className="space-y-2">
                <Label>音量</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(soundVolume * 100)}
                  onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              图片处理设置
            </CardTitle>
            <CardDescription>
              配置上传图片时的默认处理选项。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>自动 WebP 转换</Label>
                <p className="text-sm text-muted-foreground">
                  上传时自动将图片转换为 WebP 格式以减小体积
                </p>
              </div>
              <Switch
                checked={autoWebP}
                onCheckedChange={setAutoWebP}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>默认最大尺寸</Label>
              <p className="text-sm text-muted-foreground">
                上传时自动缩放图片的最大边长
              </p>
              <Select
                value={defaultMaxDimension?.toString() ?? "none"}
                onValueChange={(v) =>
                  setDefaultMaxDimension(v === "none" ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <span>
                    {defaultMaxDimension
                      ? `${defaultMaxDimension}px`
                      : "不限制"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不限制</SelectItem>
                  <SelectItem value="2048">2048px</SelectItem>
                  <SelectItem value="1536">1536px</SelectItem>
                  <SelectItem value="1024">1024px</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>默认压缩质量</Label>
              <p className="text-sm text-muted-foreground">
                {Math.round(defaultQuality * 100)}%
              </p>
              <input
                type="range"
                min="50"
                max="100"
                value={Math.round(defaultQuality * 100)}
                onChange={(e) => setDefaultQuality(Number(e.target.value) / 100)}
                className="w-full accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>本地数据</CardTitle>
            <CardDescription>
              清除浏览器中的任务历史记录。此操作不可撤销。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleClearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              清除历史记录
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
