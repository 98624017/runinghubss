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
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const { apiKey, setApiKey } = useApiKeyStore();
  const [inputKey, setInputKey] = useState(apiKey);

  const handleSave = () => {
    if (!inputKey.trim()) {
      toast.error("请输入 API Key");
      return;
    }
    setApiKey(inputKey.trim());
    toast.success("API Key 已保存");
    onOpenChange(false);
  };

  // NOTE: 余额查询功能暂时隐藏，上游 API 获取额度信息存在 bug
  // 管理后台仍可使用余额查询功能

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            设置 API Key
          </DialogTitle>
          <DialogDescription>
            输入你的 API Key 以使用 AI 生成功能。
            Key 仅保存在你的浏览器本地。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="请输入 API Key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
