"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface ImageUploaderProps {
  field: { id: string; label: string; description: string; required: boolean };
  value: string;
  onChange: (value: string) => void;
}

export function ImageUploader({ field, value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        // 预览
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        const result = await apiClient<{ fileName: string }>("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (result.success && result.data) {
          onChange(result.data.fileName);
          toast.success("上传成功");
        } else {
          toast.error(result.error || "上传失败");
          setPreview(null);
        }
      } catch {
        toast.error("上传失败");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleClear = () => {
    onChange("");
    setPreview(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {preview || value ? (
        <div className="relative w-full aspect-video rounded-lg border overflow-hidden bg-muted">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="预览" className="w-full h-full object-contain" />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8 mr-2" />
              已上传: {value}
            </div>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            id={`upload-${field.id}`}
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor={`upload-${field.id}`} className="cursor-pointer">
            {uploading ? (
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {uploading ? "上传中..." : "点击或拖拽上传图片"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              支持 JPG、PNG、WebP，最大 10MB
            </p>
          </label>
        </div>
      )}
    </div>
  );
}
