"use client";

import { Sparkles, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  type ColorAdjustments,
  DEFAULT_COLOR_ADJUSTMENTS,
  COLOR_PRESETS,
} from "@/lib/utils/image-processing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColorPanelProps {
  adjustments: ColorAdjustments;
  onAdjustmentsChange: (adjustments: ColorAdjustments) => void;
}

// ---------------------------------------------------------------------------
// Slider config
// ---------------------------------------------------------------------------

interface SliderConfig {
  key: keyof ColorAdjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: readonly SliderConfig[] = [
  { key: "brightness", label: "亮度", min: 0.5, max: 2, step: 0.05 },
  { key: "contrast", label: "对比度", min: 0.5, max: 2, step: 0.05 },
  { key: "saturation", label: "饱和度", min: 0, max: 2, step: 0.05 },
  { key: "temperature", label: "色温", min: -100, max: 100, step: 5 },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(key: keyof ColorAdjustments, value: number): string {
  if (key === "temperature") {
    if (value > 0) return `+${value}`;
    return `${value}`;
  }
  // brightness / contrast / saturation -> percentage
  return `${Math.round(value * 100)}%`;
}

function isPresetActive(
  current: ColorAdjustments,
  preset: ColorAdjustments,
): boolean {
  return JSON.stringify(current) === JSON.stringify(preset);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColorPanel({
  adjustments,
  onAdjustmentsChange,
}: ColorPanelProps) {
  const handleSliderChange = (key: keyof ColorAdjustments, raw: string) => {
    onAdjustmentsChange({ ...adjustments, [key]: Number(raw) });
  };

  const handleAutoOptimize = () => {
    onAdjustmentsChange({
      brightness: 1.1,
      contrast: 1.1,
      saturation: 1.05,
      temperature: 0,
    });
  };

  const handleReset = () => {
    onAdjustmentsChange(DEFAULT_COLOR_ADJUSTMENTS);
  };

  return (
    <div className="space-y-4">
      {/* ---- Preset filter buttons ---- */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(COLOR_PRESETS).map(([key, preset]) => {
          const active = isPresetActive(adjustments, preset.adjustments);
          return (
            <Button
              key={key}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => onAdjustmentsChange(preset.adjustments)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      <Separator />

      {/* ---- Adjustment sliders ---- */}
      <div className="space-y-3">
        {SLIDERS.map(({ key, label, min, max, step }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>{label}</Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatValue(key, adjustments[key])}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={adjustments[key]}
              onChange={(e) => handleSliderChange(key, e.target.value)}
              className="w-full accent-primary"
            />
          </div>
        ))}
      </div>

      {/* ---- Action buttons ---- */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleAutoOptimize}>
          <Sparkles className="size-3.5" />
          自动优化
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="size-3.5" />
          重置
        </Button>
      </div>
    </div>
  );
}
