import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationSettings {
  desktopEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  permission: NotificationPermission | "default";
}

interface NotificationState extends NotificationSettings {
  setDesktopEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setPermission: (permission: NotificationPermission) => void;
  requestPermission: () => Promise<NotificationPermission>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      desktopEnabled: false,
      soundEnabled: true,
      soundVolume: 0.7,
      permission: "default",

      setDesktopEnabled: (enabled) => set({ desktopEnabled: enabled }),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      setSoundVolume: (volume) =>
        set({ soundVolume: Math.min(1, Math.max(0, volume)) }),

      setPermission: (permission) => set({ permission }),

      requestPermission: async () => {
        if (typeof Notification === "undefined") return "denied";
        try {
          const result = await Notification.requestPermission();
          set({ permission: result });
          if (result === "granted") {
            set({ desktopEnabled: true });
          }
          return result;
        } catch {
          return "denied";
        }
      },
    }),
    { name: "yueanji-notification-settings" }
  )
);
