"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, GripVertical, Pencil } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const ImageEditorDialog = dynamic(
  () => import("@/components/workspace/image-editor").then((m) => ({ default: m.ImageEditorDialog })),
  { ssr: false }
);

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

interface ImageGridUploaderProps {
  imageFields: FieldDef[];
  values: Record<string, string>;
  onValuesChange: (updates: Record<string, string>) => void;
}

export function ImageGridUploader({
  imageFields,
  values,
  onValuesChange,
}: ImageGridUploaderProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [imageSizes, setImageSizes] = useState<Record<string, number>>({});
  const dragSourceIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 按 sortOrder 排序的字段列表
  const sortedFields = [...imageFields].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const uploadFile = useCallback(
    async (file: File, fieldId: string) => {
      setUploading((prev) => ({ ...prev, [fieldId]: true }));
      try {
        // 记录文件大小
        setImageSizes((prev) => ({ ...prev, [fieldId]: file.size }));

        // 生成预览
        const reader = new FileReader();
        reader.onload = (e) =>
          setPreviews((prev) => ({
            ...prev,
            [fieldId]: e.target?.result as string,
          }));
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append("file", file);

        const result = await apiClient<{ fileName: string }>("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (result.success && result.data) {
          onValuesChange({ [fieldId]: result.data.fileName });
        } else {
          toast.error(result.error || `上传失败: ${file.name}`);
          setPreviews((prev) => {
            const next = { ...prev };
            delete next[fieldId];
            return next;
          });
        }
      } catch {
        toast.error(`上传失败: ${file.name}`);
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      } finally {
        setUploading((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    [onValuesChange]
  );

  // 批量上传：将文件按顺序填入空槽位
  const handleBatchUpload = useCallback(
    (files: FileList) => {
      const emptySlots = sortedFields.filter(
        (f) => !values[f.id] && !uploading[f.id]
      );

      if (emptySlots.length === 0) {
        toast.error("所有图片位已填满");
        return;
      }

      const filesToUpload = Array.from(files).slice(0, emptySlots.length);
      const skipped = files.length - filesToUpload.length;

      if (skipped > 0) {
        toast.info(`已忽略 ${skipped} 个多余文件（空位不足）`);
      }

      // 并发上传
      filesToUpload.forEach((file, i) => {
        uploadFile(file, emptySlots[i].id);
      });
    },
    [sortedFields, values, uploading, uploadFile]
  );

  const handleBatchDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      // 只处理文件拖拽，忽略网格内拖拽排序
      if (e.dataTransfer.files.length > 0) {
        handleBatchUpload(e.dataTransfer.files);
      }
    },
    [handleBatchUpload]
  );

  const handleBatchFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleBatchUpload(e.target.files);
        e.target.value = "";
      }
    },
    [handleBatchUpload]
  );

  // 单个槽位上传
  const handleSlotUpload = useCallback(
    (fieldId: string, file: File) => {
      uploadFile(file, fieldId);
    },
    [uploadFile]
  );

  // 清除单个槽位
  const handleClear = useCallback(
    (fieldId: string) => {
      onValuesChange({ [fieldId]: "" });
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
      setImageSizes((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    },
    [onValuesChange]
  );

  // 编辑完成后重新上传处理后的图片
  const handleEditApply = useCallback(
    async (processedBlob: Blob, previewUrl: string) => {
      const fieldId = editingFieldId;
      if (!fieldId) return;

      // 批量合并同步状态更新（React 18+ 自动批处理生效）
      setEditingFieldId(null);
      setPreviews((prev) => ({ ...prev, [fieldId]: previewUrl }));
      setImageSizes((prev) => ({ ...prev, [fieldId]: processedBlob.size }));
      setUploading((prev) => ({ ...prev, [fieldId]: true }));

      try {
        const formData = new FormData();
        formData.append("file", processedBlob, "edited-image.webp");

        const result = await apiClient<{ fileName: string }>("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (result.success && result.data) {
          onValuesChange({ [fieldId]: result.data.fileName });
        } else {
          toast.error(result.error || "编辑后上传失败");
        }
      } catch {
        toast.error("编辑后上传失败");
      } finally {
        setUploading((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    [editingFieldId, onValuesChange]
  );

  // 拖拽排序
  const handleDragStart = (index: number) => {
    dragSourceIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // 只在网格内拖拽排序时高亮（不是文件拖入）
    if (dragSourceIndex.current !== null) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleGridDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const sourceIndex = dragSourceIndex.current;
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    // 如果是文件拖入到特定槽位
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleSlotUpload(sortedFields[targetIndex].id, file);
      dragSourceIndex.current = null;
      return;
    }

    // 交换两个槽位的值
    const sourceField = sortedFields[sourceIndex];
    const targetField = sortedFields[targetIndex];
    const sourceValue = values[sourceField.id] || "";
    const targetValue = values[targetField.id] || "";
    const sourcePreview = previews[sourceField.id];
    const targetPreview = previews[targetField.id];

    onValuesChange({
      [sourceField.id]: targetValue,
      [targetField.id]: sourceValue,
    });

    // 同步交换预览
    setPreviews((prev) => {
      const next = { ...prev };
      if (targetPreview) {
        next[sourceField.id] = targetPreview;
      } else {
        delete next[sourceField.id];
      }
      if (sourcePreview) {
        next[targetField.id] = sourcePreview;
      } else {
        delete next[targetField.id];
      }
      return next;
    });

    // 同步交换图片大小
    setImageSizes((prev) => {
      const next = { ...prev };
      const sourceSize = prev[sourceField.id];
      const targetSize = prev[targetField.id];
      if (targetSize) {
        next[sourceField.id] = targetSize;
      } else {
        delete next[sourceField.id];
      }
      if (sourceSize) {
        next[targetField.id] = sourceSize;
      } else {
        delete next[targetField.id];
      }
      return next;
    });

    dragSourceIndex.current = null;
  };

  const handleDragEnd = () => {
    dragSourceIndex.current = null;
    setDragOverIndex(null);
  };

  const emptyCount = sortedFields.filter((f) => !values[f.id]).length;
  const isAnyUploading = Object.values(uploading).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          图片素材
          <span className="text-muted-foreground ml-2 font-normal">
            ({sortedFields.length - emptyCount}/{sortedFields.length})
          </span>
        </label>
        {emptyCount > 0 && (
          <span className="text-xs text-muted-foreground">
            还可上传 {emptyCount} 张
          </span>
        )}
      </div>

      {/* 批量上传区 */}
      {emptyCount > 0 && (
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDrop={handleBatchDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleBatchFileSelect}
            disabled={isAnyUploading}
          />
          {isAnyUploading ? (
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {isAnyUploading
              ? "上传中..."
              : `拖拽或点击批量上传图片（最多 ${emptyCount} 张）`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            支持 JPG、PNG、WebP，最大 10MB
          </p>
        </div>
      )}

      {/* 缩略图网格 */}
      <div className="grid grid-cols-3 gap-3">
        {sortedFields.map((field, index) => {
          const hasValue = !!values[field.id];
          const preview = previews[field.id];
          const isUploading = uploading[field.id];
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={field.id}
              className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                isDragOver
                  ? "border-primary bg-primary/10 scale-105"
                  : hasValue || preview
                    ? "border-border"
                    : "border-dashed border-muted-foreground/30 hover:border-primary/40"
              }`}
              draggable={hasValue}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleGridDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* 序号标签 */}
              <span className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                {index + 1}
              </span>

              {isUploading ? (
                <div className="flex items-center justify-center h-full bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : preview || hasValue ? (
                <>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt={field.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted text-xs text-muted-foreground p-2 text-center break-all">
                      {values[field.id]}
                    </div>
                  )}

                  {/* 拖拽手柄 */}
                  <div className="absolute top-1 right-[3.25rem] z-10 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-white drop-shadow" />
                  </div>

                  {/* 编辑按钮 */}
                  {preview && (
                    <button
                      className="absolute top-1 right-7 z-10 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                      onClick={() => setEditingFieldId(field.id)}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}

                  {/* 删除按钮 */}
                  <button
                    className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                    onClick={() => handleClear(field.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSlotUpload(field.id, file);
                      e.target.value = "";
                    }}
                  />
                  <Upload className="h-5 w-5 text-muted-foreground/50 mb-1" />
                  <span className="text-xs text-muted-foreground/60 px-1 text-center truncate w-full">
                    {field.label}
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* 图片编辑弹窗 */}
      {editingFieldId && previews[editingFieldId] && (
        <ImageEditorDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingFieldId(null);
          }}
          imageSrc={previews[editingFieldId]}
          imageSize={imageSizes[editingFieldId] ?? 0}
          onApply={handleEditApply}
        />
      )}
    </div>
  );
}
