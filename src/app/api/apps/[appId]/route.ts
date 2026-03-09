import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const app = await prisma.aiApp.findFirst({
    where: { id: appId, enabled: true },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });

  if (!app) {
    return NextResponse.json(
      { success: false, error: "应用不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: app });
}
