import { z } from "zod/v4";

export const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

export const createAppSchema = z.object({
  name: z.string().min(1, "应用名称不能为空"),
  description: z.string().min(1, "应用描述不能为空"),
  icon: z.string().default("sparkles"),
  rhAppId: z.string().min(1, "RunningHub应用ID不能为空"),
  category: z.string().default("design"),
  sortOrder: z.number().default(0),
  enabled: z.boolean().default(true),
  fields: z.array(
    z.object({
      nodeId: z.string().min(1),
      fieldName: z.string().min(1),
      fieldType: z.enum(["IMAGE", "STRING", "INT", "LIST", "BOOLEAN"]),
      label: z.string().min(1),
      description: z.string().default(""),
      required: z.boolean().default(true),
      defaultValue: z.string().optional(),
      options: z.string().optional(),
      sortOrder: z.number().default(0),
    })
  ),
});

export const updateAppSchema = createAppSchema.partial().extend({
  id: z.string(),
});

export const keyMultiplierSchema = z.object({
  apiKey: z.string().min(1, "API Key不能为空"),
  multiplier: z.number().min(0.1, "倍率最小为0.1").max(100, "倍率最大为100"),
  note: z.string().optional(),
});

export const curlParseSchema = z.object({
  curl: z.string().min(1, "curl命令不能为空"),
});
