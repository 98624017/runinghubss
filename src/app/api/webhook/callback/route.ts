import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 幂等键集合，防止重复处理
const processedTasks = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // 检查 webhook 是否启用
    const config = await prisma.systemConfig.findUnique({
      where: { key: "webhookEnabled" },
    });

    if (config?.value !== "true") {
      return NextResponse.json(
        { success: false, error: "Webhook 未启用" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { taskId, taskStatus, output } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "缺少 taskId" },
        { status: 400 }
      );
    }

    // 幂等检查
    if (processedTasks.has(taskId)) {
      return NextResponse.json({ success: true, message: "已处理" });
    }

    processedTasks.add(taskId);

    // 清理旧记录，防止内存泄漏
    if (processedTasks.size > 10000) {
      const entries = Array.from(processedTasks);
      for (let i = 0; i < 5000; i++) {
        processedTasks.delete(entries[i]);
      }
    }

    // TODO: 可扩展 — 通过 SSE 推送给前端
    // TODO: 可扩展 — 转发到用户配置的 webhook URL
    console.log(`[Webhook] Task ${taskId} → ${taskStatus}`, output);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "处理失败" },
      { status: 500 }
    );
  }
}
