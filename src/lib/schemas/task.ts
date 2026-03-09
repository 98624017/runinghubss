import { z } from "zod/v4";

export const createTaskSchema = z.object({
  appId: z.string().min(1, "应用ID不能为空"),
  fields: z.record(z.string(), z.unknown()),
});

export const taskStatusSchema = z.object({
  taskId: z.string().min(1, "任务ID不能为空"),
});
