"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface BatchImage {
  id: string; // 唯一标识
  file: File;
  preview: string; // URL.createObjectURL 生成的 blob URL
  fileName: string | null; // 上传成功后的服务器文件名
  uploading: boolean;
  error: boolean;
}

interface BatchModeProps {
  onImagesReady: (fileNames: string[]) => void; // 所有图片上传完成后回调
}

// 生成唯一 ID
const generateId = () =>
  `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function BatchMode({ onImagesReady }: BatchModeProps) {
  const [images, setImages] = useState<BatchImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevAllUploadedRef = useRef(false);

  const handleUpload = useCallback(async (file: File, id: string) => {
    // 使用 createObjectURL 替代 readAsDataURL，避免大 base64 字符串内存占用
    const preview = URL.createObjectURL(file);

    setImages((prev) => [
      ...prev,
      { id, file, preview, fileName: null, uploading: true, error: false },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await apiClient<{ fileName: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (result.success && result.data) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? { ...img, fileName: result.data!.fileName, uploading: false }
              : img
          )
        );
      } else {
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, uploading: false, error: true } : img
          )
        );
        toast.error(`上传失败: ${file.name}`);
      }
    } catch {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, uploading: false, error: true } : img
        )
      );
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = Array.from(e.target.files);
      for (const file of files) {
        handleUpload(file, generateId());
      }
      e.target.value = "";
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        handleUpload(file, generateId());
      }
    },
    [handleUpload]
  );

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // 组件卸载时回收所有 blob URL
  useEffect(() => {
    return () => {
      setImages((prev) => {
        for (const img of prev) {
          URL.revokeObjectURL(img.preview);
        }
        return prev;
      });
    };
  }, []);

  const allUploaded =
    images.length > 0 && images.every((img) => img.fileName && !img.uploading);
  const isAnyUploading = images.some((img) => img.uploading);

  // 仅在 allUploaded 从 false→true 变化时通知父组件，避免无限触发
  useEffect(() => {
    if (allUploaded && !prevAllUploadedRef.current) {
      const fileNames = images
        .map((img) => img.fileName)
        .filter((name): name is string => !!name);
      onImagesReady(fileNames);
    }
    prevAllUploadedRef.current = allUploaded;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅依赖 allUploaded 变化触发，images 和 onImagesReady 在此时读取最新值即可
  }, [allUploaded]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">批量图片</label>
        <span className="text-xs text-muted-foreground">
          {images.length} 张图片，将创建 {images.length} 个任务
        </span>
      </div>

      {/* 上传区 */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={isAnyUploading}
        />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          拖拽或点击上传多张图片
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          每张图片将独立创建一个生成任务
        </p>
      </div>

      {/* 预览网格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg border overflow-hidden bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 bg-destructive/40 flex items-center justify-center">
                  <X className="h-5 w-5 text-white" />
                </div>
              )}
              <button
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(img.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
