# 悦安居 UX 体验提升实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 分三阶段提升悦安居平台用户体验：任务反馈体系、图片处理工具链、工作流效率提升。

**Architecture:** 纯前端方案，零后端改造。通知基于 Notification API + 页面内通知中心；图片处理基于 Canvas API + CSS Filters；数据持久化复用 IndexedDB + localStorage。所有新组件遵循现有 shadcn/ui + Tailwind 设计系统。

**Tech Stack:** Next.js 16 / React 19 / Zustand 5 / Dexie 4 / shadcn/ui / Tailwind v4 / Sonner / Motion / Canvas API / Notification API

---

## 阶段一：任务反馈体系（P1）

### Task 1: 通知设置 Store

**Files:**
- Create: `src/lib/stores/notification-store.ts`

**Step 1: 创建通知设置 Store**

```typescript
// src/lib/stores/notification-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationSettings {
  desktopEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0-1
  permission: NotificationPermission | "default";
}

interface NotificationStoreState extends NotificationSettings {
  setDesktopEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setPermission: (permission: NotificationPermission) => void;
  requestPermission: () => Promise<NotificationPermission>;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set) => ({
      desktopEnabled: false,
      soundEnabled: true,
      soundVolume: 0.7,
      permission: "default",

      setDesktopEnabled: (enabled) => set({ desktopEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),
      setPermission: (permission) => set({ permission }),

      requestPermission: async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
          return "denied";
        }
        const result = await Notification.requestPermission();
        set({ permission: result, desktopEnabled: result === "granted" });
        return result;
      },
    }),
    { name: "yueanji-notification-settings" }
  )
);
```

**Step 2: 验证**

Run: `npx tsc --noEmit src/lib/stores/notification-store.ts`
Expected: 无错误

**Step 3: Commit**

```bash
git add src/lib/stores/notification-store.ts
git commit -m "feat: add notification settings store with permission management"
```

---

### Task 2: 通知服务（桌面通知 + 声音）

**Files:**
- Create: `src/lib/services/notification-service.ts`
- Create: `public/sounds/task-complete.mp3` (需准备一个 <50KB 的提示音文件)

**Step 1: 创建通知服务**

```typescript
// src/lib/services/notification-service.ts
import { useNotificationStore } from "@/lib/stores/notification-store";

let audioInstance: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioInstance) {
    audioInstance = new Audio("/sounds/task-complete.mp3");
  }
  return audioInstance;
}

export function sendTaskNotification(opts: {
  title: string;
  body: string;
  icon?: string;
  onClick?: () => void;
}) {
  const { desktopEnabled, soundEnabled, soundVolume, permission } =
    useNotificationStore.getState();

  // 声音通知
  if (soundEnabled && typeof window !== "undefined") {
    try {
      const audio = getAudio();
      audio.volume = soundVolume;
      audio.currentTime = 0;
      audio.play().catch(() => {}); // 忽略自动播放限制
    } catch {
      // 静默失败
    }
  }

  // 桌面通知
  if (
    desktopEnabled &&
    permission === "granted" &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    document.hidden // 仅当页面不可见时发送桌面通知
  ) {
    try {
      const notification = new Notification(opts.title, {
        body: opts.body,
        icon: opts.icon || "/images/logo.png",
        tag: `task-${Date.now()}`,
      });

      if (opts.onClick) {
        notification.onclick = () => {
          window.focus();
          opts.onClick?.();
          notification.close();
        };
      }

      // 10 秒后自动关闭
      setTimeout(() => notification.close(), 10000);
    } catch {
      // 静默失败
    }
  }
}
```

**Step 2: 准备音频文件**

使用在线工具生成一个简短的提示音（或使用免费 CC0 音效），保存为 `public/sounds/task-complete.mp3`，确保文件 < 50KB。

**Step 3: Commit**

```bash
git add src/lib/services/notification-service.ts public/sounds/
git commit -m "feat: add notification service with desktop and sound support"
```

---

### Task 3: 在任务轮询中集成通知

**Files:**
- Modify: `src/lib/stores/task-store.ts:150-171` (updateTaskState 函数)

**Step 1: 修改 updateTaskState 以触发通知**

在 `src/lib/stores/task-store.ts` 文件顶部添加导入：

```typescript
import { sendTaskNotification } from "@/lib/services/notification-service";
```

修改 `updateTaskState` 函数，在状态更新后添加通知逻辑：

```typescript
function updateTaskState(
  taskId: string,
  status: TaskInfo["status"],
  outputs: TaskInfo["outputs"],
  error?: string
) {
  const prevTask = useTaskStore.getState().activeTasks.get(taskId);
  const wasTerminal = prevTask?.status === "SUCCESS" || prevTask?.status === "FAILED";

  useTaskStore.setState((state) => {
    const newMap = new Map(state.activeTasks);
    const task = newMap.get(taskId);
    if (task) {
      newMap.set(taskId, { ...task, status, outputs, error });
    }
    return { activeTasks: newMap };
  });

  // 更新 IndexedDB
  updateTaskRecord(taskId, {
    status,
    outputs: outputs ? { files: outputs } : null,
    completedAt: status === "SUCCESS" || status === "FAILED" ? new Date() : null,
  });

  // 任务完成时发送通知（仅在状态首次变为终态时触发）
  if (!wasTerminal && (status === "SUCCESS" || status === "FAILED")) {
    const task = useTaskStore.getState().activeTasks.get(taskId);
    if (task) {
      sendTaskNotification({
        title: status === "SUCCESS" ? "生成完成" : "生成失败",
        body:
          status === "SUCCESS"
            ? `「${task.appName}」任务已完成，点击查看结果`
            : `「${task.appName}」任务失败：${error || "未知错误"}`,
        onClick: () => {
          window.location.href = `/workspace/${task.appId}`;
        },
      });
    }
  }
}
```

**Step 2: 验证**

Run: `npx tsc --noEmit`
Expected: 无错误

**Step 3: Commit**

```bash
git add src/lib/stores/task-store.ts
git commit -m "feat: integrate notification service into task polling lifecycle"
```

---

### Task 4: 全局任务面板组件

**Files:**
- Create: `src/components/layout/task-panel.tsx`

**Step 1: 创建全局任务面板**

```tsx
// src/components/layout/task-panel.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ListChecks,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore, type TaskInfo } from "@/lib/stores/task-store";
import { cn } from "@/lib/utils";

function formatElapsed(startedAt: number): string {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}分${secs}秒`;
}

function TaskItem({ task }: { task: TaskInfo }) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(task.startedAt));

  useEffect(() => {
    if (task.status === "SUCCESS" || task.status === "FAILED") return;
    const timer = setInterval(() => {
      setElapsed(formatElapsed(task.startedAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [task.startedAt, task.status]);

  const statusConfig = {
    QUEUED: { icon: Clock, color: "text-muted-foreground", label: "排队中" },
    RUNNING: { icon: Loader2, color: "text-amber-500", label: "生成中", spin: true },
    SUCCESS: { icon: CheckCircle2, color: "text-green-500", label: "已完成" },
    FAILED: { icon: XCircle, color: "text-destructive", label: "已失败" },
  } as const;

  const config = statusConfig[task.status];
  const Icon = config.icon;

  return (
    <Link
      href={`/workspace/${task.appId}`}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent rounded-md transition-colors"
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          config.color,
          "spin" in config && config.spin ? "animate-spin" : ""
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.appName}</p>
        <p className="text-xs text-muted-foreground">{config.label} · {elapsed}</p>
      </div>
    </Link>
  );
}

export function TaskPanel() {
  const activeTasks = useTaskStore((s) => s.activeTasks);
  const [, forceUpdate] = useState(0);

  // 每秒强制刷新以更新时间显示
  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const tasks = Array.from(activeTasks.values());
  const runningCount = tasks.filter(
    (t) => t.status === "QUEUED" || t.status === "RUNNING"
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ListChecks className="h-4 w-4" />
          {runningCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center"
            >
              {runningCount}
            </Badge>
          )}
          <span className="sr-only">任务队列</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold">任务队列</p>
          <p className="text-xs text-muted-foreground">
            {runningCount > 0
              ? `${runningCount} 个任务进行中`
              : "暂无进行中的任务"}
          </p>
        </div>
        <Separator />
        {tasks.length > 0 ? (
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {tasks
                .sort((a, b) => b.startedAt - a.startedAt)
                .map((task) => (
                  <TaskItem key={task.taskId} task={task} />
                ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            暂无任务
          </div>
        )}
        <Separator />
        <div className="p-1">
          <Link
            href="/history"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <History className="h-4 w-4" />
            查看全部历史
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/layout/task-panel.tsx
git commit -m "feat: add global task panel dropdown component"
```

---

### Task 5: 将任务面板集成到 Header

**Files:**
- Modify: `src/components/layout/header.tsx`

**Step 1: 在 Header 中添加 TaskPanel**

在 `header.tsx` 文件顶部添加导入：

```typescript
import { TaskPanel } from "./task-panel";
```

在桌面导航 `</nav>` 和 `</div>` 之间（约第 104 行后）添加任务面板和分隔：

```tsx
        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1">
          {/* ...现有 navLinks 代码... */}
        </nav>

        {/* 右侧工具区 */}
        <div className="ml-auto flex items-center gap-1">
          <TaskPanel />
        </div>
```

同时在移动端 Sheet 导航底部也添加 TaskPanel。

**Step 2: 验证**

Run: `pnpm dev`（手动检查 Header 右上角出现任务图标）

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: integrate task panel into header navigation"
```

---

### Task 6: 进度增强 — 平均时长统计

**Files:**
- Modify: `src/lib/db.ts` (新增查询函数)

**Step 1: 添加平均时长查询函数**

在 `src/lib/db.ts` 末尾添加：

```typescript
// 查询特定应用的平均完成时长（毫秒）
export async function getAverageTaskDuration(
  apiKeyHash: string,
  appId: string
): Promise<number | null> {
  const records = await db.taskHistory
    .where("[apiKeyHash+appId]")
    .equals([apiKeyHash, appId])
    .filter(
      (r) => r.status === "SUCCESS" && r.completedAt !== null && r.createdAt !== null
    )
    .toArray();

  if (records.length === 0) return null;

  const durations = records
    .map((r) => {
      const created = r.createdAt instanceof Date ? r.createdAt.getTime() : new Date(r.createdAt).getTime();
      const completed = r.completedAt instanceof Date ? r.completedAt!.getTime() : new Date(r.completedAt!).getTime();
      return completed - created;
    })
    .filter((d) => d > 0 && d < 600000); // 排除异常值

  if (durations.length === 0) return null;

  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}
```

**Step 2: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add average task duration query for progress estimation"
```

---

### Task 7: 进度增强 — 改进结果面板进度显示

**Files:**
- Modify: `src/components/workspace/result-panel.tsx:80-89` (运行中状态部分)

**Step 1: 创建进度指示器子组件**

在 `result-panel.tsx` 文件内（或新建 `src/components/workspace/task-progress.tsx`）添加：

```tsx
// src/components/workspace/task-progress.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { TaskInfo } from "@/lib/stores/task-store";

interface TaskProgressProps {
  task: TaskInfo;
  avgDuration: number | null; // 毫秒，可为 null（无历史数据）
}

export function TaskProgress({ task, avgDuration }: TaskProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - task.startedAt);
    }, 1000);
    return () => clearInterval(timer);
  }, [task.startedAt]);

  const elapsedSec = Math.floor(elapsed / 1000);
  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedSecRemainder = elapsedSec % 60;
  const elapsedText =
    elapsedMin > 0
      ? `${elapsedMin}分${elapsedSecRemainder}秒`
      : `${elapsedSec}秒`;

  // 预估进度
  let progressPercent = 0;
  let estimateText = "";
  const isOvertime = avgDuration !== null && elapsed > avgDuration;

  if (avgDuration !== null) {
    progressPercent = Math.min(95, Math.round((elapsed / avgDuration) * 100));
    const remaining = Math.max(0, avgDuration - elapsed);
    const remainingSec = Math.floor(remaining / 1000);

    if (isOvertime) {
      estimateText = "比平时耗时更长，请继续等待";
    } else if (remainingSec > 60) {
      estimateText = `预计还需约 ${Math.ceil(remainingSec / 60)} 分钟`;
    } else {
      estimateText = `预计还需约 ${remainingSec} 秒`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
      <p className="text-sm font-medium">
        {task.status === "QUEUED" ? "等待服务器处理..." : "AI 正在生成中..."}
      </p>
      <p className="text-xs mt-1">已耗时 {elapsedText}</p>

      {/* 进度条 */}
      {avgDuration !== null && task.status === "RUNNING" && (
        <div className="w-48 mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isOvertime ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className={`text-xs mt-1.5 text-center ${isOvertime ? "text-amber-500" : ""}`}>
            {estimateText}
          </p>
        </div>
      )}

      {avgDuration === null && (
        <p className="text-xs mt-1">通常需要 30-120 秒</p>
      )}
    </div>
  );
}
```

**Step 2: 在 ResultPanel 中使用 TaskProgress**

修改 `src/components/workspace/result-panel.tsx`：

1. 添加导入和 props：

```typescript
import { TaskProgress } from "./task-progress";
```

2. 给 `ResultPanelProps` 增加 `avgDuration` 属性：

```typescript
interface ResultPanelProps {
  appId: string;
  currentTask: TaskInfo | null;
  avgDuration: number | null; // 新增
  onRetry: () => void;
  onSelectHistoryTask: (task: TaskHistoryItem) => void;
}
```

3. 将原来运行中状态的 JSX（第 81-89 行）替换为：

```tsx
{(currentTask.status === "RUNNING" || currentTask.status === "QUEUED") && (
  <TaskProgress task={currentTask} avgDuration={avgDuration} />
)}
```

**Step 3: 在工作区页面中计算并传入 avgDuration**

在 `src/app/workspace/[appId]/page.tsx` 中：
- 导入 `getAverageTaskDuration` 和 `useApiKeyStore`
- 用 `useEffect` 在页面加载时查询平均时长
- 将 `avgDuration` 传给 `ResultPanel`

**Step 4: Commit**

```bash
git add src/components/workspace/task-progress.tsx src/components/workspace/result-panel.tsx src/app/workspace/\[appId\]/page.tsx
git commit -m "feat: add task progress indicator with estimated time remaining"
```

---

### Task 8: 跨应用任务状态角标 — Sidebar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Step 1: 在 Sidebar 中添加任务状态角标**

修改 `sidebar.tsx`：

1. 添加导入：
```typescript
import { useTaskStore } from "@/lib/stores/task-store";
```

2. 在 `Sidebar` 组件内，添加对 activeTasks 的订阅：
```typescript
const activeTasks = useTaskStore((s) => s.activeTasks);

// 按 appId 聚合状态
function getAppStatus(appId: string): "success" | "running" | "failed" | null {
  const tasks = Array.from(activeTasks.values()).filter((t) => t.appId === appId);
  if (tasks.length === 0) return null;
  if (tasks.some((t) => t.status === "FAILED")) return "failed";
  if (tasks.some((t) => t.status === "SUCCESS")) return "success";
  if (tasks.some((t) => t.status === "RUNNING" || t.status === "QUEUED")) return "running";
  return null;
}
```

3. 在每个应用链接的 `<Icon>` 旁添加角标：

```tsx
{(() => {
  const appStatus = getAppStatus(app.id);
  if (!appStatus) return null;
  const colors = {
    success: "bg-green-500",
    running: "bg-amber-500 animate-pulse",
    failed: "bg-destructive",
  };
  return (
    <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${colors[appStatus]}`} />
  );
})()}
```

需要在 Icon 外层包裹一个 `relative` 容器。

**Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: add task status badges to sidebar app list"
```

---

### Task 9: 设置页增加通知设置

**Files:**
- Modify: `src/app/settings/page.tsx`

**Step 1: 在设置页面添加通知设置卡片**

在 API Key 管理 Card 之后、本地数据 Card 之前，添加：

```tsx
import { useNotificationStore } from "@/lib/stores/notification-store";
import { Bell, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
```

新增卡片：

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Bell className="h-5 w-5" />
      通知设置
    </CardTitle>
    <CardDescription>
      配置任务完成时的通知方式。
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>桌面通知</Label>
        <p className="text-xs text-muted-foreground">
          任务完成时发送浏览器桌面通知
        </p>
      </div>
      <Switch
        checked={desktopEnabled}
        onCheckedChange={async (checked) => {
          if (checked) {
            const result = await requestPermission();
            if (result !== "granted") {
              toast.error("浏览器拒绝了通知权限，请在浏览器设置中允许");
            }
          } else {
            setDesktopEnabled(false);
          }
        }}
      />
    </div>
    <Separator />
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          声音提醒
        </Label>
        <p className="text-xs text-muted-foreground">
          任务完成时播放提示音
        </p>
      </div>
      <Switch
        checked={soundEnabled}
        onCheckedChange={setSoundEnabled}
      />
    </div>
    {soundEnabled && (
      <div className="space-y-2">
        <Label>音量</Label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(soundVolume * 100)}
          onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
          className="w-full accent-primary"
        />
      </div>
    )}
  </CardContent>
</Card>
```

**Step 2: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add notification settings to settings page"
```

---

## 阶段二：图片处理工具链（P2）

### Task 10: 安装图片裁剪依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 react-image-crop**

Run: `pnpm add react-image-crop`

**Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-image-crop dependency for image editing"
```

---

### Task 11: 图片处理工具函数

**Files:**
- Create: `src/lib/utils/image-processing.ts`

**Step 1: 创建图片处理工具函数**

```typescript
// src/lib/utils/image-processing.ts

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorAdjustments {
  brightness: number; // 0-2, default 1
  contrast: number;   // 0-2, default 1
  saturation: number; // 0-2, default 1
  temperature: number; // -100 to 100, default 0
}

export const DEFAULT_COLOR_ADJUSTMENTS: ColorAdjustments = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
};

export const COLOR_PRESETS: Record<string, ColorAdjustments> = {
  original: DEFAULT_COLOR_ADJUSTMENTS,
  bright: { brightness: 1.2, contrast: 1.05, saturation: 1.1, temperature: 0 },
  warm: { brightness: 1.05, contrast: 1, saturation: 1.1, temperature: 30 },
  cool: { brightness: 1, contrast: 1.05, saturation: 0.9, temperature: -30 },
};

/**
 * 获取图片原始尺寸
 */
export function getImageDimensions(src: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 调整图片尺寸（保持比例）
 */
export async function resizeImage(
  src: string,
  maxDimension: number,
  format: "image/jpeg" | "image/png" | "image/webp" = "image/webp",
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(src);
  const { width, height } = img;

  let newWidth = width;
  let newHeight = height;

  if (Math.max(width, height) > maxDimension) {
    const ratio = maxDimension / Math.max(width, height);
    newWidth = Math.round(width * ratio);
    newHeight = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  return canvasToBlob(canvas, format, quality);
}

/**
 * 转换为 WebP
 */
export async function convertToWebP(
  src: string,
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  return canvasToBlob(canvas, "image/webp", quality);
}

/**
 * 裁剪图片
 */
export async function cropImage(
  src: string,
  crop: CropArea,
  format: "image/jpeg" | "image/png" | "image/webp" = "image/webp",
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    img,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, crop.width, crop.height
  );

  return canvasToBlob(canvas, format, quality);
}

/**
 * 应用颜色调整
 */
export async function applyColorAdjustments(
  src: string,
  adjustments: ColorAdjustments,
  format: "image/jpeg" | "image/png" | "image/webp" = "image/webp",
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d")!;

  // 构建 CSS filter 字符串
  const filters: string[] = [];
  filters.push(`brightness(${adjustments.brightness})`);
  filters.push(`contrast(${adjustments.contrast})`);
  filters.push(`saturate(${adjustments.saturation})`);

  // 色温通过 sepia + hue-rotate 模拟
  if (adjustments.temperature !== 0) {
    const absTemp = Math.abs(adjustments.temperature);
    const sepiaAmount = absTemp / 200; // 0 - 0.5
    filters.push(`sepia(${sepiaAmount})`);
    const hueRotate = adjustments.temperature > 0 ? -10 : 180;
    filters.push(`hue-rotate(${hueRotate}deg)`);
  }

  ctx.filter = filters.join(" ");
  ctx.drawImage(img, 0, 0);

  return canvasToBlob(canvas, format, quality);
}

/**
 * 生成 CSS filter 字符串（用于实时预览）
 */
export function buildCSSFilter(adjustments: ColorAdjustments): string {
  const parts: string[] = [];
  parts.push(`brightness(${adjustments.brightness})`);
  parts.push(`contrast(${adjustments.contrast})`);
  parts.push(`saturate(${adjustments.saturation})`);

  if (adjustments.temperature !== 0) {
    const absTemp = Math.abs(adjustments.temperature);
    parts.push(`sepia(${absTemp / 200})`);
    parts.push(`hue-rotate(${adjustments.temperature > 0 ? -10 : 180}deg)`);
  }

  return parts.join(" ");
}

/**
 * 旋转图片（90 度步进）
 */
export async function rotateImage(
  src: string,
  degrees: 90 | 180 | 270,
  format: "image/jpeg" | "image/png" | "image/webp" = "image/webp",
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");

  const isPortrait = degrees === 90 || degrees === 270;
  canvas.width = isPortrait ? img.naturalHeight : img.naturalWidth;
  canvas.height = isPortrait ? img.naturalWidth : img.naturalHeight;

  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return canvasToBlob(canvas, format, quality);
}

// 内部工具函数
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      type,
      quality
    );
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

**Step 2: Commit**

```bash
git add src/lib/utils/image-processing.ts
git commit -m "feat: add image processing utility functions (crop, resize, webp, color)"
```

---

### Task 12: 图片编辑器 — 裁剪面板

**Files:**
- Create: `src/components/workspace/image-editor/crop-panel.tsx`

**Step 1: 创建裁剪面板组件**

使用 `react-image-crop` 库实现裁剪交互，提供自由裁剪和预设比例选择（1:1, 4:3, 16:9, 3:4）。包含旋转按钮（90度步进）。

此组件接收 `imageSrc: string`，输出 `CropArea` 和旋转角度。

**Step 2: Commit**

```bash
git add src/components/workspace/image-editor/crop-panel.tsx
git commit -m "feat: add crop panel with aspect ratio presets and rotation"
```

---

### Task 13: 图片编辑器 — 调整面板（尺寸 + 格式）

**Files:**
- Create: `src/components/workspace/image-editor/resize-panel.tsx`

**Step 1: 创建调整面板组件**

显示当前图片尺寸、文件大小。提供预设尺寸按钮（2048px / 1536px / 1024px），WebP 转换开关。实时显示预估处理后文件大小。

**Step 2: Commit**

```bash
git add src/components/workspace/image-editor/resize-panel.tsx
git commit -m "feat: add resize and format conversion panel"
```

---

### Task 14: 图片编辑器 — 调色面板

**Files:**
- Create: `src/components/workspace/image-editor/color-panel.tsx`

**Step 1: 创建调色面板组件**

4 个滑块（亮度、对比度、饱和度、色温），预设按钮（原图、明亮、暖色、冷色），"自动优化"按钮。通过 `buildCSSFilter()` 实时预览。

**Step 2: Commit**

```bash
git add src/components/workspace/image-editor/color-panel.tsx
git commit -m "feat: add color adjustment panel with presets and live preview"
```

---

### Task 15: 图片编辑器 — 主弹窗组件

**Files:**
- Create: `src/components/workspace/image-editor/image-editor-dialog.tsx`
- Create: `src/components/workspace/image-editor/index.ts`

**Step 1: 创建编辑器弹窗**

使用 shadcn/ui `Dialog`（大尺寸），顶部 `Tabs`（裁剪 | 调整 | 调色），中间实时预览画布，底部参数控制区，操作栏（重置 | 取消 | 应用）。

`ImageEditorDialog` 接收 props：
```typescript
interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string; // Base64 或 URL
  onApply: (processedBlob: Blob, previewUrl: string) => void;
}
```

点击"应用"时，按顺序执行所有操作：裁剪 → 缩放 → 调色 → 格式转换，输出最终 Blob。

**Step 2: 导出 barrel**

```typescript
// src/components/workspace/image-editor/index.ts
export { ImageEditorDialog } from "./image-editor-dialog";
```

**Step 3: Commit**

```bash
git add src/components/workspace/image-editor/
git commit -m "feat: add image editor dialog with crop, resize, and color tabs"
```

---

### Task 16: 将编辑器集成到 ImageUploader

**Files:**
- Modify: `src/components/workspace/fields/image-uploader.tsx`

**Step 1: 在上传后的缩略图上添加"编辑"按钮**

当图片已上传且有预览时，在缩略图右下角显示编辑按钮（Pencil icon）。点击打开 `ImageEditorDialog`。编辑完成后，将处理后的 Blob 重新上传到服务器，更新预览和 value。

**Step 2: Commit**

```bash
git add src/components/workspace/fields/image-uploader.tsx
git commit -m "feat: integrate image editor into single image uploader"
```

---

### Task 17: 将编辑器集成到 ImageGridUploader

**Files:**
- Modify: `src/components/workspace/fields/image-grid-uploader.tsx`

**Step 1: 在网格缩略图上添加"编辑"按钮**

与 Task 16 类似，每个有图片的槽位都显示编辑按钮。使用同一个 `ImageEditorDialog`。

**Step 2: Commit**

```bash
git add src/components/workspace/fields/image-grid-uploader.tsx
git commit -m "feat: integrate image editor into grid image uploader"
```

---

### Task 18: 设置页添加图片处理默认配置

**Files:**
- Modify: `src/app/settings/page.tsx`

**Step 1: 添加图片处理设置卡片**

新增卡片：自动 WebP 转换开关、默认最大尺寸选择。创建 `src/lib/stores/image-settings-store.ts` 用于持久化设置。

**Step 2: Commit**

```bash
git add src/lib/stores/image-settings-store.ts src/app/settings/page.tsx
git commit -m "feat: add image processing settings with WebP and resize defaults"
```

---

## 阶段三：工作流效率提升（P3）

### Task 19: 模板数据模型和 DB 操作

**Files:**
- Modify: `src/lib/types.ts` (添加 Template 接口)
- Modify: `src/lib/db.ts` (添加 templates 表和操作函数)

**Step 1: 定义模板类型**

在 `src/lib/types.ts` 中添加：

```typescript
export interface Template {
  id?: number;
  name: string;
  appId: string;
  apiKeyHash: string;
  values: Record<string, string>; // 不含 IMAGE 类型字段
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 2: 升级数据库版本**

在 `src/lib/db.ts` 中：

```typescript
const db = new Dexie("YueanjiDB") as Dexie & {
  taskHistory: EntityTable<TaskHistoryItem, "id">;
  templates: EntityTable<Template, "id">;
};

db.version(1).stores({
  taskHistory: "++id, apiKeyHash, taskId, appId, status, createdAt, [apiKeyHash+appId]",
});

db.version(2).stores({
  taskHistory: "++id, apiKeyHash, taskId, appId, status, createdAt, [apiKeyHash+appId]",
  templates: "++id, apiKeyHash, appId, [apiKeyHash+appId]",
});
```

添加模板 CRUD 函数：`addTemplate`, `getTemplates`, `updateTemplate`, `deleteTemplate`。

**Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/db.ts
git commit -m "feat: add template data model and IndexedDB operations"
```

---

### Task 20: 模板选择器和保存组件

**Files:**
- Create: `src/components/workspace/template-selector.tsx`

**Step 1: 创建模板选择器**

包含：
- 下拉菜单列出已保存的模板
- "保存为模板"按钮（弹出命名对话框）
- 模板管理（重命名、删除）

集成到 WorkspaceForm 顶部。

**Step 2: Commit**

```bash
git add src/components/workspace/template-selector.tsx
git commit -m "feat: add template selector and save dialog"
```

---

### Task 21: 将模板选择器集成到工作区表单

**Files:**
- Modify: `src/components/workspace/workspace-form.tsx`

**Step 1: 在表单顶部添加模板选择器**

加载模板时，将模板的 values 预填到表单中（仅非 IMAGE 字段）。保存模板时，过滤掉 IMAGE 类型字段的值。

**Step 2: Commit**

```bash
git add src/components/workspace/workspace-form.tsx
git commit -m "feat: integrate template selector into workspace form"
```

---

### Task 22: 历史快速复用功能

**Files:**
- Modify: `src/components/history/task-detail-dialog.tsx` (添加"复用"按钮)

**Step 1: 在历史详情弹窗中添加"复用此参数"按钮**

点击后使用 `router.push(`/workspace/${task.appId}?reuse=${task.id}`)` 导航，工作区页面接收参数后从 IndexedDB 读取 inputs 并预填表单。

**Step 2: Commit**

```bash
git add src/components/history/task-detail-dialog.tsx src/app/workspace/\[appId\]/page.tsx
git commit -m "feat: add parameter reuse from task history"
```

---

### Task 23: 失败一键重试

**Files:**
- Modify: `src/components/workspace/result-panel.tsx`
- Modify: `src/components/workspace/workspace-form.tsx`

**Step 1: 改进重试机制**

当前已有 `onRetry` 回调但仅触发重新提交。改进为：在 `addTask` 时同时保存 inputs 快照到 TaskInfo 或 IndexedDB，重试时自动使用上次完全相同的参数。

历史记录中的失败任务也添加"重试"按钮。

**Step 2: Commit**

```bash
git add src/components/workspace/result-panel.tsx src/components/workspace/workspace-form.tsx
git commit -m "feat: improve retry with automatic parameter restoration"
```

---

### Task 24: 表单自动保存（草稿）

**Files:**
- Create: `src/lib/hooks/use-form-draft.ts`
- Modify: `src/components/workspace/workspace-form.tsx`

**Step 1: 创建草稿 hook**

```typescript
// src/lib/hooks/use-form-draft.ts
import { useEffect, useRef } from "react";

const DRAFT_PREFIX = "yueanji-draft-";

export function useFormDraft(
  appId: string,
  values: Record<string, string>,
  setValues: (values: Record<string, string>) => void
) {
  const initialized = useRef(false);

  // 恢复草稿
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = localStorage.getItem(`${DRAFT_PREFIX}${appId}`);
    if (saved) {
      try {
        const draft = JSON.parse(saved) as Record<string, string>;
        // 仅恢复非 IMAGE 字段
        setValues(draft);
        return; // 调用方可以显示 toast 提示
      } catch {
        // 忽略
      }
    }
  }, [appId, setValues]);

  // 自动保存（防抖 1 秒）
  useEffect(() => {
    if (!initialized.current) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`${DRAFT_PREFIX}${appId}`, JSON.stringify(values));
    }, 1000);
    return () => clearTimeout(timer);
  }, [appId, values]);

  return {
    clearDraft: () => localStorage.removeItem(`${DRAFT_PREFIX}${appId}`),
  };
}
```

**Step 2: 在 WorkspaceForm 中使用**

任务提交成功后调用 `clearDraft()`。进入页面恢复草稿后显示 toast "已恢复上次编辑"。

**Step 3: Commit**

```bash
git add src/lib/hooks/use-form-draft.ts src/components/workspace/workspace-form.tsx
git commit -m "feat: add form auto-save draft with localStorage"
```

---

### Task 25: 批量任务提交

**Files:**
- Create: `src/components/workspace/batch-mode.tsx`
- Modify: `src/components/workspace/workspace-form.tsx`

**Step 1: 创建批量模式组件**

在表单中添加"批量模式"开关。开启后，图片上传区变为批量区：允许上传 N 张图片（不限于字段数量），每张图片独立生成一个任务。显示"即将提交 N 个任务"预览。

**Step 2: 修改 handleSubmit 支持批量**

批量模式下，循环为每张图片创建独立任务，共享其他参数。

**Step 3: Commit**

```bash
git add src/components/workspace/batch-mode.tsx src/components/workspace/workspace-form.tsx
git commit -m "feat: add batch task submission mode"
```

---

### Task 26: 首次使用引导

**Files:**
- Create: `src/components/workspace/onboarding-guide.tsx`
- Modify: `src/app/workspace/[appId]/page.tsx`

**Step 1: 创建引导组件**

使用 Tooltip 显示 3-4 步引导：
1. "选择应用" → 指向侧边栏
2. "填写参数" → 指向表单区
3. "上传图片" → 指向图片上传区
4. "查看结果" → 指向结果区

使用 localStorage 记录 `yueanji-onboarded` 状态，不再重复显示。

**Step 2: Commit**

```bash
git add src/components/workspace/onboarding-guide.tsx src/app/workspace/\[appId\]/page.tsx
git commit -m "feat: add first-time user onboarding guide"
```

---

### Task 27: 结果对比视图

**Files:**
- Create: `src/components/workspace/compare-view.tsx`
- Modify: `src/components/workspace/result-panel.tsx`

**Step 1: 创建对比视图组件**

复用已有的 `before-after-slider` 组件（`src/components/landing/before-after-slider.tsx`），支持原图 vs 生成结果的左右滑动对比。在结果面板中添加"对比"按钮，仅当有原始图片和结果图片时显示。

**Step 2: Commit**

```bash
git add src/components/workspace/compare-view.tsx src/components/workspace/result-panel.tsx
git commit -m "feat: add before/after comparison view for generated results"
```

---

## 总览

| 阶段 | Task | 描述 | 依赖 |
|------|------|------|------|
| P1 | 1 | 通知设置 Store | — |
| P1 | 2 | 通知服务（桌面+声音） | 1 |
| P1 | 3 | 集成通知到任务轮询 | 2 |
| P1 | 4 | 全局任务面板组件 | — |
| P1 | 5 | 任务面板集成到 Header | 4 |
| P1 | 6 | 进度增强 — 平均时长统计 | — |
| P1 | 7 | 进度增强 — 改进结果面板 | 6 |
| P1 | 8 | 跨应用任务状态角标 | — |
| P1 | 9 | 设置页通知配置 | 1 |
| P2 | 10 | 安装图片裁剪依赖 | — |
| P2 | 11 | 图片处理工具函数 | — |
| P2 | 12 | 裁剪面板 | 10, 11 |
| P2 | 13 | 调整面板（尺寸+格式） | 11 |
| P2 | 14 | 调色面板 | 11 |
| P2 | 15 | 编辑器主弹窗 | 12, 13, 14 |
| P2 | 16 | 集成到 ImageUploader | 15 |
| P2 | 17 | 集成到 ImageGridUploader | 15 |
| P2 | 18 | 图片处理设置 | 11 |
| P3 | 19 | 模板数据模型和 DB | — |
| P3 | 20 | 模板选择器组件 | 19 |
| P3 | 21 | 模板集成到表单 | 20 |
| P3 | 22 | 历史快速复用 | — |
| P3 | 23 | 失败一键重试 | — |
| P3 | 24 | 表单自动保存 | — |
| P3 | 25 | 批量任务提交 | — |
| P3 | 26 | 首次使用引导 | — |
| P3 | 27 | 结果对比视图 | — |

**可并行执行的任务组：**
- P1: [1,4,6,8] 可并行 → 然后 [2,5,7,9] → 然后 [3]
- P2: [10,11] 可并行 → 然后 [12,13,14] 可并行 → 然后 [15] → 然后 [16,17,18] 可并行
- P3: [19,22,23,24,25,26,27] 大部分可并行 → [20] → [21]
