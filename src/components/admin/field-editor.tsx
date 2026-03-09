"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { FIELD_TYPES } from "@/lib/constants";

export interface FieldConfig {
  nodeId: string;
  fieldName: string;
  fieldType: string;
  label: string;
  description: string;
  required: boolean;
  defaultValue: string;
  options: string;
  sortOrder: number;
}

interface FieldEditorProps {
  fields: FieldConfig[];
  onChange: (fields: FieldConfig[]) => void;
}

function createEmptyField(sortOrder: number): FieldConfig {
  return {
    nodeId: "",
    fieldName: "",
    fieldType: "STRING",
    label: "",
    description: "",
    required: false,
    defaultValue: "",
    options: "",
    sortOrder,
  };
}

export function FieldEditor({ fields, onChange }: FieldEditorProps) {
  const addField = () => {
    onChange([...fields, createEmptyField(fields.length)]);
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    // 重新排序
    onChange(updated.map((f, i) => ({ ...f, sortOrder: i })));
  };

  const updateField = (index: number, key: keyof FieldConfig, value: string | boolean) => {
    const updated = fields.map((f, i) =>
      i === index ? { ...f, [key]: value } : f
    );
    onChange(updated);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated.map((f, i) => ({ ...f, sortOrder: i })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">字段配置</h3>
        <Button variant="outline" size="sm" onClick={addField}>
          <Plus className="h-4 w-4 mr-1" />
          添加字段
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          暂无字段，点击"添加字段"或使用"从 curl 导入"
        </p>
      )}

      {fields.map((field, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              字段 #{index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveField(index, "up")}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveField(index, "down")}
                disabled={index === fields.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">节点 ID</label>
              <Input
                placeholder="nodeId"
                value={field.nodeId}
                onChange={(e) => updateField(index, "nodeId", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">字段名</label>
              <Input
                placeholder="fieldName"
                value={field.fieldName}
                onChange={(e) => updateField(index, "fieldName", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">显示名称</label>
              <Input
                placeholder="显示名称"
                value={field.label}
                onChange={(e) => updateField(index, "label", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">字段类型</label>
              <Select
                value={field.fieldType}
                onValueChange={(v) => updateField(index, "fieldType", v ?? "STRING")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">描述</label>
            <Input
              placeholder="字段描述"
              value={field.description}
              onChange={(e) => updateField(index, "description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">默认值</label>
              <Input
                placeholder="默认值"
                value={field.defaultValue}
                onChange={(e) => updateField(index, "defaultValue", e.target.value)}
              />
            </div>
            {field.fieldType === "LIST" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">选项 (JSON 数组)</label>
                <Input
                  placeholder='["选项1","选项2"]'
                  value={field.options}
                  onChange={(e) => updateField(index, "options", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={field.required}
              onCheckedChange={(v) => updateField(index, "required", v)}
            />
            <label className="text-xs text-muted-foreground">必填</label>
          </div>
        </div>
      ))}
    </div>
  );
}
