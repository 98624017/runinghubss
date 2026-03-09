"use client";

import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { KeyRound, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { apiKey, setApiKey, clearApiKey } = useApiKeyStore();
  const [inputKey, setInputKey] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInputKey(apiKey);
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

  const handleClearHistory = () => {
    if (typeof window !== "undefined") {
      indexedDB.deleteDatabase("YueanjiDB");
      toast.success("本地历史数据已清除");
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
              RunningHub API Key 仅保存在浏览器本地，不会上传到服务器。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-api-key">API Key</Label>
              <Input
                id="settings-api-key"
                type="password"
                placeholder="请输入 RunningHub API Key"
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
