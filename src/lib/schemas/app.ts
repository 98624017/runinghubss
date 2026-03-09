import { z } from "zod/v4";

export const aiAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  rhAppId: z.string(),
  category: z.string(),
  sortOrder: z.number(),
  enabled: z.boolean(),
  fields: z.array(
    z.object({
      id: z.string(),
      nodeId: z.string(),
      fieldName: z.string(),
      fieldType: z.enum(["IMAGE", "STRING", "INT", "LIST", "BOOLEAN"]),
      label: z.string(),
      description: z.string(),
      required: z.boolean(),
      defaultValue: z.string().nullable(),
      options: z.string().nullable(), // JSON string
      sortOrder: z.number(),
    })
  ),
});

export type AiAppWithFields = z.infer<typeof aiAppSchema>;
