import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { addTaskRecord, updateTaskRecord } from "@/lib/db";
import { hashApiKey } from "@/lib/utils/crypto";
import { useApiKeyStore } from "./api-key-store";
import { POLLING_INTERVALS } from "@/lib/constants";

export interface TaskInfo {
  taskId: string;
  appId: string;
  appName: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: number;
  outputs: Array<{ fileUrl: string; fileType: string }> | null;
  error?: string;
}

interface TaskStoreState {
  activeTasks: Map<string, TaskInfo>;
  addTask: (task: Omit<TaskInfo, "startedAt" | "outputs" | "status">) => void;
  removeTask: (taskId: string) => void;
  getTask: (taskId: string) => TaskInfo | undefined;
  concurrentCount: () => number;
}

function getPollingInterval(elapsedMs: number): number {
  if (elapsedMs < 30_000) return POLLING_INTERVALS.FAST;     // 3s
  if (elapsedMs < 120_000) return POLLING_INTERVALS.MEDIUM;  // 5s
  return POLLING_INTERVALS.SLOW;                              // 10s
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  activeTasks: new Map(),

  addTask: (task) => {
    const taskInfo: TaskInfo = {
      ...task,
      status: "QUEUED",
      startedAt: Date.now(),
      outputs: null,
    };

    set((state) => {
      const newMap = new Map(state.activeTasks);
      newMap.set(task.taskId, taskInfo);
      return { activeTasks: newMap };
    });

    // 保存到 IndexedDB
    const apiKey = useApiKeyStore.getState().apiKey;
    if (apiKey) {
      addTaskRecord({
        apiKeyHash: hashApiKey(apiKey),
        appId: task.appId,
        appName: task.appName,
        taskId: task.taskId,
        status: "QUEUED",
        inputs: {},
        outputs: null,
        createdAt: new Date(),
        completedAt: null,
        costInfo: null,
      });
    }

    // 开始轮询
    pollTask(task.taskId);
  },

  removeTask: (taskId) => {
    set((state) => {
      const newMap = new Map(state.activeTasks);
      newMap.delete(taskId);
      return { activeTasks: newMap };
    });
  },

  getTask: (taskId) => {
    return get().activeTasks.get(taskId);
  },

  concurrentCount: () => {
    return get().activeTasks.size;
  },
}));

async function pollTask(taskId: string) {
  const store = useTaskStore.getState();
  const task = store.activeTasks.get(taskId);
  if (!task) return;

  const elapsed = Date.now() - task.startedAt;

  // 超时处理
  if (elapsed > POLLING_INTERVALS.TIMEOUT) {
    updateTaskState(taskId, "FAILED", null, "任务超时（超过10分钟）");
    return;
  }

  try {
    const result = await apiClient<{ taskStatus: string; taskId: string }>(
      "/api/task/status",
      { method: "POST", body: JSON.stringify({ taskId }) }
    );

    if (!result.success) {
      // 查询失败不立即终止，继续重试
      scheduleNextPoll(taskId);
      return;
    }

    const status = result.data?.taskStatus;

    if (status === "SUCCESS") {
      // 获取结果
      const resultData = await apiClient<Array<{ fileUrl: string; fileType: string }>>(
        "/api/task/result",
        { method: "POST", body: JSON.stringify({ taskId }) }
      );
      updateTaskState(taskId, "SUCCESS", resultData.data || null);
      return;
    }

    if (status === "FAILED") {
      updateTaskState(taskId, "FAILED", null, "任务执行失败");
      return;
    }

    // QUEUED 或 RUNNING，更新状态继续轮询
    if (status === "RUNNING") {
      updateTaskState(taskId, "RUNNING", null);
    }

    scheduleNextPoll(taskId);
  } catch {
    scheduleNextPoll(taskId);
  }
}

function scheduleNextPoll(taskId: string) {
  const task = useTaskStore.getState().activeTasks.get(taskId);
  if (!task) return;

  const elapsed = Date.now() - task.startedAt;
  const interval = getPollingInterval(elapsed);

  setTimeout(() => pollTask(taskId), interval);
}

function updateTaskState(
  taskId: string,
  status: TaskInfo["status"],
  outputs: TaskInfo["outputs"],
  error?: string
) {
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
}
