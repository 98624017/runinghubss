import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";
import { createAppSchema } from "@/lib/schemas/admin";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const apps = await prisma.aiApp.findMany({
      include: { fields: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: apps });
  });
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const parsed = createAppSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { fields, ...appData } = parsed.data;

      const app = await prisma.aiApp.create({
        data: {
          ...appData,
          fields: {
            create: fields,
          },
        },
        include: { fields: true },
      });

      return NextResponse.json({ success: true, data: app });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "创建失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
