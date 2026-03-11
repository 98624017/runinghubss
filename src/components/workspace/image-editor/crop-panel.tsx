"use client";

import { useRef, useCallback } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CropPanelProps {
  imageSrc: string;
  crop: Crop | undefined;
  onCropChange: (crop: Crop) => void;
  rotation: number;
  onRotationChange: (deg: number) => void;
  aspectRatio: number | undefined;
  onAspectRatioChange: (ratio: number | undefined) => void;
}

const ASPECT_PRESETS: readonly { label: string; value: number | undefined }[] =
  [
    { label: "自由", value: undefined },
    { label: "1:1", value: 1 },
    { label: "3:4", value: 3 / 4 },
    { label: "4:3", value: 4 / 3 },
    { label: "9:16", value: 9 / 16 },
    { label: "16:9", value: 16 / 9 },
  ] as const;

/** Create a crop centered within the rendered image at the given aspect ratio. */
function createCenteredCrop(
  aspect: number,
  imgWidth: number,
  imgHeight: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, imgWidth, imgHeight),
    imgWidth,
    imgHeight,
  );
}

export function CropPanel({
  imageSrc,
  crop,
  onCropChange,
  rotation,
  onRotationChange,
  aspectRatio,
  onAspectRatioChange,
}: CropPanelProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  const handleRotate = () => {
    onRotationChange((rotation + 90) % 360);
  };

  const isAspectSelected = (value: number | undefined) => {
    if (value === undefined && aspectRatio === undefined) return true;
    if (value === undefined || aspectRatio === undefined) return false;
    return Math.abs(value - aspectRatio) < 0.001;
  };

  /** When user picks a preset, set the aspect and create a centered crop box. */
  const handleAspectChange = (value: number | undefined) => {
    onAspectRatioChange(value);
    if (value !== undefined && imgRef.current) {
      const { width, height } = imgRef.current;
      if (width > 0 && height > 0) {
        onCropChange(createCenteredCrop(value, width, height));
      }
    }
  };

  /** When a new image loads (e.g. after rotation), re-create the centered crop. */
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (aspectRatio !== undefined) {
        const { width, height } = e.currentTarget;
        if (width > 0 && height > 0) {
          onCropChange(createCenteredCrop(aspectRatio, width, height));
        }
      }
    },
    [aspectRatio, onCropChange],
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar: aspect ratio presets + rotation */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {ASPECT_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={isAspectSelected(preset.value) ? "default" : "outline"}
            size="sm"
            onClick={() => handleAspectChange(preset.value)}
          >
            {preset.label}
          </Button>
        ))}

        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="mr-1 size-3.5" />
            旋转
          </Button>
        </div>
      </div>

      {/* Crop area — image is pre-rotated by parent, no CSS transform needed */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden select-none touch-none">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => onCropChange(percentCrop)}
          aspect={aspectRatio}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="裁剪预览"
            className="block"
            style={{ maxHeight: "min(400px, calc(90vh - 16rem))" }}
            onLoad={handleImageLoad}
          />
        </ReactCrop>
      </div>
    </div>
  );
}
