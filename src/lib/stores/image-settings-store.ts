import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ImageSettings {
  autoWebP: boolean; // 是否默认启用 WebP 转换
  defaultMaxDimension: number | null; // 默认最大尺寸 (null = 不缩放)
  defaultQuality: number; // 默认质量 0-1
}

interface ImageSettingsState extends ImageSettings {
  setAutoWebP: (enabled: boolean) => void;
  setDefaultMaxDimension: (dimension: number | null) => void;
  setDefaultQuality: (quality: number) => void;
}

export const useImageSettingsStore = create<ImageSettingsState>()(
  persist(
    (set) => ({
      autoWebP: false,
      defaultMaxDimension: null,
      defaultQuality: 0.95,

      setAutoWebP: (enabled) => set({ autoWebP: enabled }),

      setDefaultMaxDimension: (dimension) =>
        set({ defaultMaxDimension: dimension }),

      setDefaultQuality: (quality) =>
        set({ defaultQuality: Math.min(1, Math.max(0.5, quality)) }),
    }),
    { name: "yueanji-image-settings" }
  )
);
