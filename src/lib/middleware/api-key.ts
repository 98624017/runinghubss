import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { hashApiKey } from "@/lib/utils/crypto";
import { ApiResponse } from "@/lib/types";

export function extractApiKey(req: NextRequest): string | null {
  return req.headers.get("x-api-key");
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
