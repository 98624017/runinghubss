import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";
import { createAppSchema } from "@/lib/schemas/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    const { id } = await params;
    const app = await prisma.aiApp.findUnique({
      where: { id },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    });

    if (!app) {
      return NextResponse.json({ success: false, error: "应用不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: app });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      const parsed = createAppSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { fields, ...appData } = parsed.data;

      // 事务：更新应用 + 重建字段
      const app = await prisma.$transaction(async (tx) => {
        await tx.aiAppField.deleteMany({ where: { appId: id } });
        return tx.aiApp.update({
          where: { id },
          data: {
            ...appData,
            fields: { create: fields },
          },
          include: { fields: true },
        });
      });

      return NextResponse.json({ success: true, data: app });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "更新失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      await prisma.aiApp.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
    }
  });
}
