import { useNotificationStore } from "@/lib/stores/notification-store";

let audioInstance: HTMLAudioElement | null = null;

interface TaskNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  onClick?: () => void;
}

export function sendTaskNotification(opts: TaskNotificationOptions): void {
  if (typeof window === "undefined") return;

  const { desktopEnabled, soundEnabled, soundVolume, permission } =
    useNotificationStore.getState();

  // Sound notification
  if (soundEnabled) {
    try {
      if (!audioInstance) {
        audioInstance = new Audio("/sounds/task-complete.mp3");
      }
      audioInstance.volume = soundVolume;
      audioInstance.currentTime = 0;
      audioInstance.play().catch(() => {});
    } catch {
      // Silently handle any audio errors
    }
  }

  // Desktop notification (only when page is not visible)
  if (desktopEnabled && permission === "granted" && document.hidden) {
    try {
      const notification = new Notification(opts.title, {
        body: opts.body,
        icon: opts.icon ?? "/images/logo.png",
        tag: `task-${Date.now()}`,
      });

      notification.onclick = () => {
        window.focus();
        opts.onClick?.();
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 10_000);
    } catch {
      // Silently handle notification errors
    }
  }
}
