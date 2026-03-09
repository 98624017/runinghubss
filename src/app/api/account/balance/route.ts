import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { getAccountBalance } from "@/lib/runninghub/client";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const result = await getAccountBalance(apiKey);
      return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "查询余额失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
