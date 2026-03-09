"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApiClient } from "@/lib/admin-api-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface KeyMultiplierFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function KeyMultiplierForm({ open, onClose, onSuccess }: KeyMultiplierFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [multiplier, setMultiplier] = useState("1");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      toast.error("请输入 API Key");
      return;
    }

    const mult = parseFloat(multiplier);
    if (isNaN(mult) || mult <= 0) {
      toast.error("倍率必须大于 0");
      return;
    }

    setSaving(true);
    try {
      const result = await adminApiClient("/api/admin/keys", {
        method: "POST",
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          multiplier: mult,
          note: remark.trim() || null,
        }),
      });

      if (result.success) {
        toast.success("添加成功");
        setApiKey("");
        setMultiplier("1");
        setRemark("");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "添加失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加 Key 倍率</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key *</label>
            <Input
              placeholder="输入完整的 API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">倍率 *</label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="1.0"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              大于 1 表示扣费翻倍，小于 1 表示折扣
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">备注</label>
            <Input
              placeholder="可选备注"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            确认添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
