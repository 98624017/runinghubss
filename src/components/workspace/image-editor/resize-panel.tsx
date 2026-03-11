"use client";

import { AlertTriangle, Image } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils/image-processing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResizePanelProps {
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  targetMaxDimension: number | null;
  onTargetChange: (maxDim: number | null) => void;
  convertToWebP: boolean;
  onConvertChange: (enabled: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PresetOption {
  label: string;
  value: number | null;
}

const PRESETS: readonly PresetOption[] = [
  { label: "原始尺寸", value: null },
  { label: "2048px", value: 2048 },
  { label: "1536px", value: 1536 },
  { label: "1024px", value: 1024 },
] as const;

/**
 * Given original dimensions and a max-dimension cap, compute the resulting
 * width and height while preserving the aspect ratio.
 */
function computeScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number | null,
): { width: number; height: number } {
  if (maxDimension === null) {
    return { width: originalWidth, height: originalHeight };
  }

  const longestEdge = Math.max(originalWidth, originalHeight);
  const scale = Math.min(maxDimension / longestEdge, 1);

  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResizePanel({
  originalWidth,
  originalHeight,
  originalSize,
  targetMaxDimension,
  onTargetChange,
  convertToWebP,
  onConvertChange,
}: ResizePanelProps) {
  const longestEdge = Math.max(originalWidth, originalHeight);
  const showSizeWarning = longestEdge > 2048;

  return (
    <div className="space-y-4">
      {/* ---- Original image info ---- */}
      <div className="space-y-1.5">
        <Label>
          <Image className="size-4" />
          原始图片信息
        </Label>
        <p className="text-muted-foreground text-sm">
          尺寸 {originalWidth} x {originalHeight} &middot;{" "}
          {formatFileSize(originalSize)}
        </p>
      </div>

      {/* ---- Resize presets ---- */}
      <div className="space-y-2">
        <Label>尺寸调整</Label>

        {showSizeWarning && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-2.5 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span className="text-sm">
              图片尺寸较大，建议缩小以加快处理速度
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = targetMaxDimension === preset.value;
            const { width, height } = computeScaledDimensions(
              originalWidth,
              originalHeight,
              preset.value,
            );

            return (
              <Button
                key={preset.label}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn("flex-col h-auto py-1.5 px-3")}
                onClick={() => onTargetChange(preset.value)}
              >
                <span className="text-xs font-medium">{preset.label}</span>
                <span
                  className={cn(
                    "text-[10px]",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {width} x {height}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* ---- WebP conversion ---- */}
      <div className="space-y-2">
        <Label>格式转换</Label>

        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">转为 WebP (质量 0.95)</p>
            <p className="text-muted-foreground text-xs">
              可减小文件体积约 30-50%
            </p>
          </div>
          <Switch
            checked={convertToWebP}
            onCheckedChange={onConvertChange}
          />
        </div>
      </div>
    </div>
  );
}
