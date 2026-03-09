import Dexie, { type EntityTable } from "dexie";
import { TaskHistoryItem } from "./types";

const db = new Dexie("YueanjiDB") as Dexie & {
  taskHistory: EntityTable<TaskHistoryItem, "id">;
};

db.version(1).stores({
  taskHistory: "++id, apiKeyHash, taskId, appId, status, createdAt, [apiKeyHash+appId]",
});

export { db };

// 添加任务记录
export async function addTaskRecord(item: Omit<TaskHistoryItem, "id">) {
  return db.taskHistory.add(item as TaskHistoryItem);
}

// 更新任务记录
export async function updateTaskRecord(
  taskId: string,
  updates: Partial<TaskHistoryItem>
) {
  const record = await db.taskHistory.where("taskId").equals(taskId).first();
  if (record?.id) {
    return db.taskHistory.update(record.id, updates);
  }
}

// 按 API Key 查询历史
export async function getTaskHistory(apiKeyHash: string) {
  return db.taskHistory
    .where("apiKeyHash")
    .equals(apiKeyHash)
    .reverse()
    .sortBy("createdAt");
}

// 按应用和 Key 查询历史
export async function getTaskHistoryByApp(apiKeyHash: string, appId: string) {
  return db.taskHistory
    .where("[apiKeyHash+appId]")
    .equals([apiKeyHash, appId])
    .reverse()
    .sortBy("createdAt");
}

// 清理旧记录
export async function cleanOldRecords(days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return db.taskHistory.where("createdAt").below(cutoff).delete();
}
