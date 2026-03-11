import {
  Palette,
  Repeat,
  Layers,
  Home,
  Sparkles,
  Building,
  Wand2,
  ImagePlus,
  PaintBucket,
} from "lucide-react";

/**
 * 应用图标映射表（集中管理）
 * key 为数据库 icon 列的英文标识符，value 为 lucide 图标组件
 */
export const iconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  palette: Palette,
  repeat: Repeat,
  layers: Layers,
  home: Home,
  sparkles: Sparkles,
  building: Building,
  wand: Wand2,
  imagePlus: ImagePlus,
  paintBucket: PaintBucket,
};

/** 获取图标组件，未匹配时返回默认 Sparkles */
export function getIcon(
  key: string
): React.ComponentType<{ className?: string }> {
  return iconMap[key] || Sparkles;
}
