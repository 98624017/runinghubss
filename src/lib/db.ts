import Dexie, { type EntityTable } from "dexie";
import { TaskHistoryItem, Template } from "./types";

const db = new Dexie("YueanjiDB") as Dexie & {
  taskHistory: EntityTable<TaskHistoryItem, "id">;
  templates: EntityTable<Template, "id">;
};

db.version(1).stores({
  taskHistory: "++id, apiKeyHash, taskId, appId, status, createdAt, [apiKeyHash+appId]",
});

db.version(2).stores({
  taskHistory: "++id, apiKeyHash, taskId, appId, status, createdAt, [apiKeyHash+appId]",
  templates: "++id, apiKeyHash, appId, name, updatedAt, [apiKeyHash+appId]",
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

/**
 * 查询特定应用的平均完成时长（毫秒）
 * 仅统计 SUCCESS 状态且有 completedAt 的记录
 * 过滤异常值（>600000ms 即 10 分钟）
 * 返回 null 表示无历史数据
 */
export async function getAverageTaskDuration(
  apiKeyHash: string,
  appId: string
): Promise<number | null> {
  const records = await db.taskHistory
    .where("[apiKeyHash+appId]")
    .equals([apiKeyHash, appId])
    .filter(
      (record) => record.status === "SUCCESS" && record.completedAt !== null
    )
    .toArray();

  const durations = records
    .map((record) => {
      const completedAt = new Date(record.completedAt!).getTime();
      const createdAt = new Date(record.createdAt).getTime();
      return completedAt - createdAt;
    })
    .filter((duration) => duration > 0 && duration < 600000);

  if (durations.length === 0) {
    return null;
  }

  const total = durations.reduce((sum, d) => sum + d, 0);
  return Math.round(total / durations.length);
}

// 添加模板
export async function addTemplate(template: Omit<Template, "id">): Promise<number> {
  const id = await db.templates.add(template as Template);
  return id as number;
}

// 查询模板列表
export async function getTemplates(apiKeyHash: string, appId: string): Promise<Template[]> {
  return db.templates
    .where("[apiKeyHash+appId]")
    .equals([apiKeyHash, appId])
    .sortBy("updatedAt");
}

// 更新模板
export async function updateTemplate(id: number, updates: Partial<Template>): Promise<number> {
  return db.templates.update(id, { ...updates, updatedAt: new Date() });
}

// 删除模板
export async function deleteTemplate(id: number): Promise<void> {
  return db.templates.delete(id);
}
