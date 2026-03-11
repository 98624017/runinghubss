import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";
import { keyMultiplierSchema } from "@/lib/schemas/admin";
import { hashApiKey, maskApiKey } from "@/lib/utils/crypto";
import { invalidateVerifiedKeyCache } from "@/lib/middleware/api-key";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const keys = await prisma.keyMultiplier.findMany({
      orderBy: { createdAt: "desc" },
    });

    const mapped = keys.map((k) => ({
      id: k.id,
      apiKeyHash: k.apiKeyHash,
      apiKeyMasked: `${k.apiKeyHash.slice(0, 8)}...${k.apiKeyHash.slice(-4)}`,
      multiplier: k.multiplier,
      remark: k.note,
      createdAt: k.createdAt,
    }));

    return NextResponse.json({ success: true, data: mapped });
  });
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const parsed = keyMultiplierSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { apiKey, multiplier, note } = parsed.data;
      const apiKeyHash = hashApiKey(apiKey);

      const result = await prisma.keyMultiplier.upsert({
        where: { apiKeyHash },
        update: { multiplier, note },
        create: {
          apiKeyHash,
          multiplier,
          note: note || maskApiKey(apiKey),
        },
      });

      // 立即同步同进程缓存状态，避免短时间内“旧缓存”影响鉴权
      invalidateVerifiedKeyCache(apiKeyHash);

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "操作失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
