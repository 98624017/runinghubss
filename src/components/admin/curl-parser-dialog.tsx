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
import { Textarea } from "@/components/ui/textarea";
import { adminApiClient } from "@/lib/admin-api-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { FieldConfig } from "./field-editor";

interface CurlParserDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (appId: string, fields: FieldConfig[]) => void;
}

interface ParsedField {
  nodeId: string;
  fieldName: string;
  fieldValue: string;
}

export function CurlParserDialog({ open, onClose, onImport }: CurlParserDialogProps) {
  const [curlCommand, setCurlCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    appId: string;
    fields: ParsedField[];
  } | null>(null);

  const handleParse = async () => {
    if (!curlCommand.trim()) {
      toast.error("请粘贴 curl 命令");
      return;
    }

    setLoading(true);
    try {
      const result = await adminApiClient<{
        appId: string;
        fields: ParsedField[];
      }>("/api/admin/parse-curl", {
        method: "POST",
        body: JSON.stringify({ curl: curlCommand }),
      });

      if (result.success && result.data) {
        setPreview({
          appId: result.data.appId,
          fields: result.data.fields,
        });
      } else {
        toast.error(result.error || "解析失败");
      }
    } catch {
      toast.error("解析失败");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!preview) return;

    const fields: FieldConfig[] = preview.fields.map((f, i) => ({
      nodeId: f.nodeId,
      fieldName: f.fieldName,
      fieldType: guessFieldType(f.fieldName, f.fieldValue),
      label: f.fieldName,
      description: "",
      required: true,
      defaultValue: f.fieldValue,
      options: "",
      sortOrder: i,
    }));

    onImport(preview.appId, fields);
    handleClose();
  };

  const handleClose = () => {
    setCurlCommand("");
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>从 curl 命令导入</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            <Textarea
              placeholder="粘贴 RunningHub 的 curl 命令..."
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
            <Button onClick={handleParse} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              解析
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">
              <span className="text-muted-foreground">RunningHub App ID: </span>
              <span className="font-mono">{preview.appId}</span>
            </div>
            <div className="rounded-lg border">
              <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>节点 ID</span>
                <span>字段名</span>
                <span>默认值</span>
              </div>
              {preview.fields.map((f, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 gap-2 px-3 py-2 border-b last:border-b-0 text-sm"
                >
                  <span className="font-mono text-xs">{f.nodeId}</span>
                  <span>{f.fieldName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {f.fieldValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          {preview && (
            <Button onClick={handleConfirmImport}>确认导入</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function guessFieldType(fieldName: string, value: string): string {
  const lower = fieldName.toLowerCase();
  if (lower.includes("image") || lower.includes("img") || lower.includes("upload")) {
    return "IMAGE";
  }
  if (value === "true" || value === "false") {
    return "BOOLEAN";
  }
  if (/^\d+$/.test(value)) {
    return "INT";
  }
  return "STRING";
}
