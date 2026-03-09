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
      return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "查询失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
