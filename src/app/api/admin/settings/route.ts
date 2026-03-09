import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const configs = await prisma.systemConfig.findMany();
    const settings = configs.map((c) => ({ key: c.key, value: c.value }));
    return NextResponse.json({ success: true, data: settings });
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body: Record<string, string> = await req.json();

      const updates = Object.entries(body).map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      );

      await prisma.$transaction(updates);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "保存失败" }, { status: 500 });
    }
  });
}
