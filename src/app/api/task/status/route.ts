import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { getTaskStatus } from "@/lib/runninghub/client";
import { taskStatusSchema } from "@/lib/schemas/task";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const body = await req.json();
      const parsed = taskStatusSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const result = await getTaskStatus(apiKey, parsed.data.taskId);
      // V1 接口返回 {code: 0, data: "RUNNING"}，data 是字符串
      // 前端 task-store 期望 {taskStatus: string} 格式
      return NextResponse.json({
        success: true,
        data: { taskStatus: result.data, taskId: parsed.data.taskId },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "查询失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
