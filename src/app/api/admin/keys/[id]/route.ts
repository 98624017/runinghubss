import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";
import { invalidateVerifiedKeyCache } from "@/lib/middleware/api-key";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      const deleted = await prisma.keyMultiplier.delete({
        where: { id },
        select: { apiKeyHash: true },
      });
      invalidateVerifiedKeyCache(deleted.apiKeyHash);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
    }
  });
}
