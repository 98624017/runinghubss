"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const { apiKey, setApiKey } = useApiKeyStore();
  const [inputKey, setInputKey] = useState(apiKey);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  const handleSave = () => {
    if (!inputKey.trim()) {
      toast.error("请输入 API Key");
      return;
    }
    setApiKey(inputKey.trim());
    toast.success("API Key 已保存");
    onOpenChange(false);
  };

  const handleCheckBalance = async () => {
    if (!inputKey.trim()) {
      toast.error("请先输入 API Key");
      return;
    }
    setLoading(true);
    const prevKey = useApiKeyStore.getState().apiKey;
    try {
      // 临时设置 key 用于查询（apiClient 从 store 读取）
      setApiKey(inputKey.trim());
      const result = await apiClient<{ balance: number }>("/api/account/balance", {
        method: "POST",
      });
      if (result.success && result.data) {
        setBalance(String(result.data.balance));
        toast.success("查询成功");
      } else {
        toast.error(result.error || "查询失败");
      }
    } catch {
      toast.error("查询失败，请检查 Key 是否有效");
    } finally {
      // 无论成功失败，恢复原来的 key（用户需要点"保存"才真正持久化）
      setApiKey(prevKey);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            设置 API Key
          </DialogTitle>
          <DialogDescription>
            输入你的 RunningHub API Key 以使用 AI 生成功能。
            Key 仅保存在你的浏览器本地。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="请输入 RunningHub API Key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
            />
          </div>
          {balance !== null && (
            <p className="text-sm text-muted-foreground">
              账户余额: <span className="font-medium text-foreground">{balance}</span>
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCheckBalance} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              查询余额
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
