import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { createTask } from "@/lib/runninghub/client";
import { createTaskSchema } from "@/lib/schemas/task";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const body = await req.json();
      const parsed = createTaskSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { appId, fields } = parsed.data;

      // 获取应用配置以拿到 rhAppId
      const app = await prisma.aiApp.findUnique({
        where: { id: appId },
        include: { fields: true },
      });

      if (!app || !app.enabled) {
        return NextResponse.json(
          { success: false, error: "应用不存在或未启用" },
          { status: 404 }
        );
      }

      // 组装 nodeInfoList
      const nodeInfoList = app.fields
        .filter((f) => {
          const value = fields[f.id];
          return value !== undefined && value !== null && value !== "";
        })
        .map((f) => ({
          nodeId: f.nodeId,
          fieldName: f.fieldName,
          fieldValue: String(fields[f.id]),
        }));

      const result = await createTask(apiKey, app.rhAppId, nodeInfoList);

      return NextResponse.json({
        success: true,
        data: { taskId: result.data.taskId },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "创建任务失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
