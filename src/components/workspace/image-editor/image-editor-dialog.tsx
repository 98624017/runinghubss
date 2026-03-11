"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type Crop } from "react-image-crop";
import { Crop as CropIcon, Maximize, Palette, Loader2, RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { CropPanel } from "./crop-panel";
import { ResizePanel } from "./resize-panel";
import { ColorPanel } from "./color-panel";

import {
  type CropArea,
  type ColorAdjustments,
  type ImageDimensions,
  DEFAULT_COLOR_ADJUSTMENTS,
  getImageDimensions,
  cropImage,
  resizeImage,
  applyColorAdjustments,
  rotateImage,
  convertToWebP as convertToWebPFn,
  buildCSSFilter,
  blobToDataURL,
} from "@/lib/utils/image-processing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  imageSize: number;
  onApply: (processedBlob: Blob, previewUrl: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImageEditorDialog({
  open,
  onOpenChange,
  imageSrc,
  imageSize,
  onApply,
}: ImageEditorDialogProps) {
  // ---- State ---------------------------------------------------------------

  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [rotation, setRotation] = useState<number>(0);
  const [rotatedSrc, setRotatedSrc] = useState<string>(imageSrc);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [targetMaxDimension, setTargetMaxDimension] = useState<number | null>(null);
  const [convertToWebP, setConvertToWebP] = useState<boolean>(false);
  const [colorAdjustments, setColorAdjustments] = useState<ColorAdjustments>(
    DEFAULT_COLOR_ADJUSTMENTS,
  );
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  /** Guard against stale rotation results when user clicks rotate rapidly. */
  const rotationGenRef = useRef(0);

  // ---- Initialise rotatedSrc when dialog opens -----------------------------

  useEffect(() => {
    if (open && imageSrc) {
      setRotatedSrc(imageSrc);
    }
  }, [open, imageSrc]);

  // ---- Refresh dimensions whenever the effective source changes ------------

  useEffect(() => {
    if (rotatedSrc) {
      getImageDimensions(rotatedSrc)
        .then(setImageDimensions)
        .catch((err) => console.error("Failed to get image dimensions:", err));
    }
  }, [rotatedSrc]);

  // ---- Handle rotation (pre-rotate for crop accuracy) ----------------------

  const handleRotationChange = useCallback(
    async (deg: number) => {
      setRotation(deg);
      setCrop(undefined);
      const gen = ++rotationGenRef.current;

      if (deg === 0) {
        setRotatedSrc(imageSrc);
        return;
      }

      try {
        const blob = await rotateImage(imageSrc, deg as 90 | 180 | 270);
        if (rotationGenRef.current !== gen) return;
        const url = await blobToDataURL(blob);
        if (rotationGenRef.current !== gen) return;
        setRotatedSrc(url);
      } catch (err) {
        console.error("Failed to rotate image:", err);
      }
    },
    [imageSrc],
  );

  // ---- Reset all state to defaults -----------------------------------------

  const handleReset = useCallback(() => {
    setCrop(undefined);
    setRotation(0);
    setRotatedSrc(imageSrc);
    setAspectRatio(undefined);
    setTargetMaxDimension(null);
    setConvertToWebP(false);
    setColorAdjustments(DEFAULT_COLOR_ADJUSTMENTS);
    rotationGenRef.current++;
  }, [imageSrc]);

  // ---- Apply pipeline ------------------------------------------------------

  const handleApply = useCallback(async () => {
    setProcessing(true);
    try {
      // Start with the already-rotated source (rotation baked in by Canvas)
      let currentSrc = rotatedSrc;

      // 1. Crop (if crop area is defined with non-zero dimensions)
      if (crop && crop.width > 0 && crop.height > 0) {
        const dims = await getImageDimensions(currentSrc);
        const pixelCrop: CropArea =
          crop.unit === "%"
            ? {
                x: (crop.x / 100) * dims.width,
                y: (crop.y / 100) * dims.height,
                width: (crop.width / 100) * dims.width,
                height: (crop.height / 100) * dims.height,
              }
            : {
                x: crop.x,
                y: crop.y,
                width: crop.width,
                height: crop.height,
              };
        const blob = await cropImage(currentSrc, pixelCrop);
        currentSrc = await blobToDataURL(blob);
      }

      // 2. Color adjustments (if not default)
      const isDefaultColor =
        JSON.stringify(colorAdjustments) === JSON.stringify(DEFAULT_COLOR_ADJUSTMENTS);
      if (!isDefaultColor) {
        const blob = await applyColorAdjustments(currentSrc, colorAdjustments);
        currentSrc = await blobToDataURL(blob);
      }

      // 3. Resize (if targetMaxDimension is set)
      if (targetMaxDimension) {
        const format = convertToWebP ? "image/webp" : undefined;
        const blob = await resizeImage(currentSrc, targetMaxDimension, format);
        currentSrc = await blobToDataURL(blob);
      } else if (convertToWebP) {
        // Convert format only (no resize)
        const blob = await convertToWebPFn(currentSrc);
        currentSrc = await blobToDataURL(blob);
      }

      // Generate final blob
      const finalRes = await fetch(currentSrc);
      const finalBlob = await finalRes.blob();
      onApply(finalBlob, currentSrc);
      onOpenChange(false);
    } catch (err) {
      console.error("图片处理失败:", err);
    } finally {
      setProcessing(false);
    }
  }, [
    rotatedSrc,
    crop,
    colorAdjustments,
    targetMaxDimension,
    convertToWebP,
    onApply,
    onOpenChange,
  ]);

  // ---- Render ---------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>编辑图片</DialogTitle>
          <DialogDescription className="sr-only">
            裁剪、调整尺寸和调色
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="crop" className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0">
            <TabsTrigger value="crop">
              <CropIcon className="size-4" />
              裁剪
            </TabsTrigger>
            <TabsTrigger value="resize">
              <Maximize className="size-4" />
              调整
            </TabsTrigger>
            <TabsTrigger value="color">
              <Palette className="size-4" />
              调色
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-4 flex flex-col">
            <TabsContent value="crop" className="flex-1 min-h-0">
              <CropPanel
                imageSrc={rotatedSrc}
                crop={crop}
                onCropChange={setCrop}
                rotation={rotation}
                onRotationChange={handleRotationChange}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
              />
            </TabsContent>

            <TabsContent value="resize" className="flex-1 min-h-0 overflow-y-auto">
              {imageDimensions ? (
                <ResizePanel
                  originalWidth={imageDimensions.width}
                  originalHeight={imageDimensions.height}
                  originalSize={imageSize}
                  targetMaxDimension={targetMaxDimension}
                  onTargetChange={setTargetMaxDimension}
                  convertToWebP={convertToWebP}
                  onConvertChange={setConvertToWebP}
                />
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  正在加载图片信息...
                </div>
              )}
            </TabsContent>

            <TabsContent value="color" className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {/* Real-time CSS filter preview */}
                <div className="flex items-center justify-center rounded-md border bg-muted/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rotatedSrc}
                    alt="调色预览"
                    className="max-h-[300px] object-contain"
                    style={{ filter: buildCSSFilter(colorAdjustments) }}
                  />
                </div>
                <ColorPanel
                  adjustments={colorAdjustments}
                  onAdjustmentsChange={setColorAdjustments}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={processing}>
            <RotateCcw className="size-3.5" />
            重置
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            取消
          </Button>
          <Button size="sm" onClick={handleApply} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                处理中...
              </>
            ) : (
              "应用"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
