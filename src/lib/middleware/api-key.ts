import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { hashApiKey } from "@/lib/utils/crypto";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";

// 已验证 Key 的内存缓存，避免每次请求都查数据库
const verifiedKeyCache = new Map<string, number>(); // hash -> expireAt
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟缓存（缩短撤销窗口）

/**
 * 主动失效已验证 Key 的缓存
 * - 单实例：立即生效
 * - 多实例/Serverless：仍需依赖 TTL 兜底
 */
export function invalidateVerifiedKeyCache(keyHash?: string) {
  if (keyHash) {
    verifiedKeyCache.delete(keyHash);
    return;
  }
  verifiedKeyCache.clear();
}

export function extractApiKey(req: NextRequest): string | null {
  return req.headers.get("x-api-key");
}

/**
 * 校验 API Key 是否已在后台注册（KeyMultiplier 表中存在记录）
 * 使用内存缓存减少数据库查询
 */
async function isKeyRegistered(keyHash: string): Promise<boolean> {
  const now = Date.now();
  const cachedExpire = verifiedKeyCache.get(keyHash);
  if (cachedExpire !== undefined && cachedExpire > now) {
    return true;
  }

  const record = await prisma.keyMultiplier.findUnique({
    where: { apiKeyHash: keyHash },
    select: { id: true },
  });

  if (record) {
    verifiedKeyCache.set(keyHash, now + CACHE_TTL_MS);
    return true;
  }

  // 清除过期缓存条目（惰性清理）
  verifiedKeyCache.delete(keyHash);
  return false;
}

export async function withApiKey(
  req: NextRequest,
  handler: (req: NextRequest, apiKey: string) => Promise<NextResponse<ApiResponse>>
): Promise<NextResponse<ApiResponse>> {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "请先设置 API Key" },
      { status: 401 }
    );
  }

  const keyHash = hashApiKey(apiKey);

  // 校验 Key 是否已在后台注册
  const registered = await isKeyRegistered(keyHash);
  if (!registered) {
    return NextResponse.json(
      { success: false, error: "API Key 未授权，请联系管理员获取有效的 API Key" },
      { status: 403 }
    );
  }

  const { allowed, remaining } = checkRateLimit(keyHash);

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const response = await handler(req, apiKey);
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}
