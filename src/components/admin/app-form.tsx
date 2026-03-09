"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldEditor, type FieldConfig } from "./field-editor";
import { CurlParserDialog } from "./curl-parser-dialog";
import { adminApiClient } from "@/lib/admin-api-client";
import { Loader2, Import } from "lucide-react";
import { toast } from "sonner";

interface AppFormData {
  name: string;
  description: string;
  icon: string;
  rhAppId: string;
  category: string;
  sortOrder: number;
  enabled: boolean;
}

interface AppFormProps {
  initialData?: AppFormData & { id?: string; fields?: FieldConfig[] };
  mode: "create" | "edit";
}

export function AppForm({ initialData, mode }: AppFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [curlOpen, setCurlOpen] = useState(false);

  const [formData, setFormData] = useState<AppFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    icon: initialData?.icon ?? "🏠",
    rhAppId: initialData?.rhAppId ?? "",
    category: initialData?.category ?? "decoration",
    sortOrder: initialData?.sortOrder ?? 0,
    enabled: initialData?.enabled ?? true,
  });

  const [fields, setFields] = useState<FieldConfig[]>(initialData?.fields ?? []);

  const updateField = <K extends keyof AppFormData>(key: K, value: AppFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCurlImport = (appId: string, importedFields: FieldConfig[]) => {
    if (!formData.rhAppId) {
      updateField("rhAppId", appId);
    }
    setFields(importedFields);
    toast.success(`导入 ${importedFields.length} 个字段`);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.rhAppId) {
      toast.error("请填写应用名称和 RunningHub App ID");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        fields: fields.map((f) => ({
          ...f,
          defaultValue: f.defaultValue || null,
          options: f.options || null,
        })),
      };

      const url =
        mode === "create"
          ? "/api/admin/apps"
          : `/api/admin/apps/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const result = await adminApiClient(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (result.success) {
        toast.success(mode === "create" ? "创建成功" : "更新成功");
        router.push("/admin/apps");
      } else {
        toast.error(result.error || "保存失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 基础信息 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">基础信息</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">应用名称 *</label>
            <Input
              placeholder="如：一键彩平"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">RunningHub App ID *</label>
            <Input
              placeholder="如：1886861880455917570"
              value={formData.rhAppId}
              onChange={(e) => updateField("rhAppId", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">描述</label>
          <Textarea
            placeholder="应用描述"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">图标 (Emoji)</label>
            <Input
              placeholder="🏠"
              value={formData.icon}
              onChange={(e) => updateField("icon", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">分类</label>
            <Input
              placeholder="decoration"
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">排序</label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => updateField("sortOrder", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.enabled}
            onCheckedChange={(v) => updateField("enabled", v)}
          />
          <label className="text-sm">启用</label>
        </div>
      </div>

      {/* 字段配置 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurlOpen(true)}>
            <Import className="h-4 w-4 mr-1" />
            从 curl 导入
          </Button>
        </div>
        <FieldEditor fields={fields} onChange={setFields} />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {mode === "create" ? "创建应用" : "保存修改"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>

      <CurlParserDialog
        open={curlOpen}
        onClose={() => setCurlOpen(false)}
        onImport={handleCurlImport}
      />
    </div>
  );
}
