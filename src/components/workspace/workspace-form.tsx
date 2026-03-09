"use client";

import { useState, useCallback } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldRenderer } from "./fields/field-renderer";
import { apiClient } from "@/lib/api-client";
import { useTaskStore } from "@/lib/stores/task-store";
import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { MAX_CONCURRENT_TASKS } from "@/lib/constants";
import { toast } from "sonner";

interface FieldDef {
  id: string;
  nodeId: string;
  fieldName: string;
  fieldType: string;
  label: string;
  description: string;
  required: boolean;
  defaultValue: string | null;
  options: string | null;
  sortOrder: number;
}

interface WorkspaceFormProps {
  appId: string;
  appName: string;
  fields: FieldDef[];
  onTaskCreated: (taskId: string) => void;
}

export function WorkspaceForm({
  appId,
  appName,
  fields,
  onTaskCreated,
}: WorkspaceFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.id] = "";
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const apiKey = useApiKeyStore((s) => s.apiKey);

  const handleChange = useCallback((fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSubmit = async () => {
    // 校验 API Key
    if (!apiKey) {
      toast.error("请先设置 API Key");
      return;
    }

    // 校验必填字段
    for (const field of fields) {
      if (field.required) {
        const val = values[field.id] || field.defaultValue || "";
        if (!val) {
          toast.error(`请填写「${field.label}」`);
          return;
        }
      }
    }

    // 并发检查
    const count = useTaskStore.getState().concurrentCount();
    if (count >= MAX_CONCURRENT_TASKS) {
      toast.error(`当前已有 ${count} 个任务在运行，请等待完成后再提交`);
      return;
    }

    setSubmitting(true);

    try {
      // 组装 fields 映射: fieldId → value
      const fieldMap: Record<string, string> = {};
      for (const field of fields) {
        const val = values[field.id] || field.defaultValue || "";
        if (val) {
          fieldMap[field.id] = val;
        }
      }

      // 创建任务（API 会根据 appId 查找应用配置并组装 nodeInfoList）
      const result = await apiClient<{ taskId: string }>("/api/task/create", {
        method: "POST",
        body: JSON.stringify({
          appId,
          fields: fieldMap,
        }),
      });

      if (result.success && result.data) {
        const { taskId } = result.data;

        // 添加到任务队列（自动开始轮询）
        useTaskStore.getState().addTask({
          taskId,
          appId,
          appName,
        });

        onTaskCreated(taskId);
        toast.success("任务已提交，正在生成中...");
      } else {
        toast.error(result.error || "创建任务失败");
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">输入参数</h3>

      {fields
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(v) => handleChange(field.id, v)}
          />
        ))}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={submitting || !apiKey}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            提交中...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            开始生成
          </>
        )}
      </Button>

      {!apiKey && (
        <p className="text-xs text-muted-foreground text-center">
          请先在设置中配置 API Key
        </p>
      )}
    </div>
  );
}
