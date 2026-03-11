"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FieldRenderer } from "./fields/field-renderer";
import { ImageGridUploader } from "./fields/image-grid-uploader";
import { BatchMode } from "./batch-mode";
import { apiClient } from "@/lib/api-client";
import { useTaskStore } from "@/lib/stores/task-store";
import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { MAX_CONCURRENT_TASKS } from "@/lib/constants";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { TemplateSelector } from "./template-selector";
import { hashApiKey } from "@/lib/utils/crypto";
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
  initialValues?: Record<string, string>; // 重试时恢复的输入参数
}

export function WorkspaceForm({
  appId,
  appName,
  fields,
  onTaskCreated,
  initialValues,
}: WorkspaceFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.id] = initialValues?.[field.id] || "";
    }
    return initial;
  });

  // 当 initialValues 变化时（如重试恢复），更新表单值
  // 使用 ref 记录上次 initialValues，通过值比对避免引用变化导致重复触发
  const prevInitialValuesRef = useRef<Record<string, string> | undefined>(undefined);
  const hasInitialValues = !!(initialValues && Object.keys(initialValues).length > 0);

  useEffect(() => {
    if (!hasInitialValues || !initialValues) return;

    // 值比对：避免相同值的不同引用导致重复触发
    const prev = prevInitialValuesRef.current;
    if (prev && JSON.stringify(prev) === JSON.stringify(initialValues)) return;
    prevInitialValuesRef.current = initialValues;

    setValues((prevValues) => {
      const updated = { ...prevValues };
      for (const [key, val] of Object.entries(initialValues)) {
        if (val) {
          updated[key] = val;
        }
      }
      return updated;
    });
    toast.info("已加载历史参数");
  }, [hasInitialValues, initialValues]);
  const [submitting, setSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchFileNames, setBatchFileNames] = useState<string[]>([]);
  const apiKey = useApiKeyStore((s) => s.apiKey);

  const handleChange = useCallback((fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleBatchChange = useCallback((updates: Record<string, string>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  }, []);

  const apiKeyHash = apiKey ? hashApiKey(apiKey) : "";

  // 加载模板时的回调
  const handleLoadTemplate = useCallback((templateValues: Record<string, string>) => {
    setValues((prev) => {
      const updated = { ...prev };
      for (const [key, val] of Object.entries(templateValues)) {
        if (key in updated) {
          updated[key] = val;
        }
      }
      return updated;
    });
  }, []);

  // 按类型分组字段
  const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const imageFields = sortedFields.filter((f) => f.fieldType === "IMAGE");
  const otherFields = sortedFields.filter((f) => f.fieldType !== "IMAGE");
  const imageFieldIds = useMemo(() => imageFields.map((f) => f.id), [imageFields]);
  const useGridMode = imageFields.length > 4;

  const { clearDraft } = useFormDraft(appId, values, handleBatchChange, imageFieldIds, hasInitialValues);

  const handleSubmit = async () => {
    // 校验 API Key
    if (!apiKey) {
      toast.error("请先设置 API Key，正在跳转到设置页...");
      router.push("/settings");
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

    // 批量模式：每张图片创建一个独立任务
    if (batchMode && batchFileNames.length > 0) {
      const mainImageFieldId = imageFields[0]?.id;
      if (!mainImageFieldId) {
        setSubmitting(false);
        return;
      }

      // 组装基础 fields 映射（不含图片字段）
      const baseFieldMap: Record<string, string> = {};
      for (const field of fields) {
        if (field.fieldType === "IMAGE") continue;
        const val = values[field.id] || field.defaultValue || "";
        if (val) {
          baseFieldMap[field.id] = val;
        }
      }

      const results = await Promise.allSettled(
        batchFileNames.map(async (fileName) => {
          const batchFieldMap = { ...baseFieldMap, [mainImageFieldId]: fileName };
          const result = await apiClient<{ taskId: string }>(
            "/api/task/create",
            {
              method: "POST",
              body: JSON.stringify({ appId, fields: batchFieldMap }),
            }
          );
          return { result, batchFieldMap };
        })
      );

      let successCount = 0;
      for (const settled of results) {
        if (settled.status === "fulfilled") {
          const { result, batchFieldMap } = settled.value;
          if (result.success && result.data) {
            useTaskStore.getState().addTask({
              taskId: result.data.taskId,
              appId,
              appName,
              inputs: batchFieldMap,
            });
            onTaskCreated(result.data.taskId);
            successCount++;
          }
        }
        // rejected 的直接忽略，单个失败不影响其他
      }

      if (successCount > 0) {
        toast.success(`已提交 ${successCount} 个批量任务`);
        clearDraft();
        setBatchFileNames([]);
      } else {
        toast.error("批量提交全部失败");
      }

      setSubmitting(false);
      return;
    }

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

        // 组装当前表单值作为输入快照
        const inputSnapshot: Record<string, string> = {};
        for (const field of fields) {
          const val = values[field.id] || field.defaultValue || "";
          if (val) {
            inputSnapshot[field.id] = val;
          }
        }

        // 添加到任务队列（自动开始轮询）
        useTaskStore.getState().addTask({
          taskId,
          appId,
          appName,
          inputs: inputSnapshot,
        });

        onTaskCreated(taskId);
        toast.success("任务已提交，正在生成中...");
        clearDraft();
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">输入参数</h3>
        {apiKey && (
          <TemplateSelector
            appId={appId}
            apiKeyHash={apiKeyHash}
            currentValues={values}
            imageFieldIds={imageFieldIds}
            onLoadTemplate={handleLoadTemplate}
          />
        )}
      </div>

      {useGridMode ? (
        <>
          {otherFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(v) => handleChange(field.id, v)}
            />
          ))}
          {batchMode ? (
            <BatchMode
              onImagesReady={setBatchFileNames}
            />
          ) : (
            <ImageGridUploader
              imageFields={imageFields}
              values={values}
              onValuesChange={handleBatchChange}
            />
          )}
        </>
      ) : batchMode && imageFields.length > 0 ? (
        <>
          {otherFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(v) => handleChange(field.id, v)}
            />
          ))}
          <BatchMode
            onImagesReady={setBatchFileNames}
          />
        </>
      ) : (
        fields
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(v) => handleChange(field.id, v)}
            />
          ))
      )}

      {/* 批量模式开关 - 仅当有图片字段时显示 */}
      {imageFields.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label className="text-sm">批量模式</Label>
            <p className="text-xs text-muted-foreground">
              上传多张图片，每张独立生成
            </p>
          </div>
          <Switch checked={batchMode} onCheckedChange={setBatchMode} />
        </div>
      )}

      <Button
        className="w-full h-14 text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white"
        size="lg"
        onClick={handleSubmit}
        disabled={submitting || !apiKey || (batchMode && batchFileNames.length === 0)}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            提交中...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            {batchMode && batchFileNames.length > 0
              ? `批量生成 (${batchFileNames.length} 个任务)`
              : "开始生成"}
          </>
        )}
      </Button>

      {!apiKey && (
        <button
          onClick={() => router.push("/settings")}
          className="text-xs text-primary hover:underline text-center cursor-pointer"
        >
          请先在设置中配置 API Key →
        </button>
      )}
    </div>
  );
}
