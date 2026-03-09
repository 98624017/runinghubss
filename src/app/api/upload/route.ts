import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { uploadFile } from "@/lib/runninghub/client";
import { MAX_UPLOAD_SIZE, ACCEPTED_IMAGE_TYPES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "未选择文件" },
          { status: 400 }
        );
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "仅支持 JPG、PNG、WebP 格式" },
          { status: 400 }
        );
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        return NextResponse.json(
          { success: false, error: `文件大小不能超过 ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile(apiKey, buffer, file.name);

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "上传失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
