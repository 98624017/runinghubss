import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth";
import { parseCurlCommand } from "@/lib/utils/curl-parser";

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { curl } = await req.json();
      const parsed = parseCurlCommand(curl);

      // 将 nodeInfoList 转换为字段配置建议
      const fields = parsed.nodeInfoList.map((node, index) => ({
        nodeId: node.nodeId,
        fieldName: node.fieldName,
        fieldType: inferFieldType(node.fieldValue, node.fieldName),
        label: node.description || `字段 ${node.nodeId}`,
        description: node.description || "",
        required: true,
        defaultValue: isImageField(node.fieldName, node.fieldValue) ? undefined : node.fieldValue,
        sortOrder: index + 1,
      }));

      return NextResponse.json({
        success: true,
        data: { appId: parsed.appId, fields },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "解析失败";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
  });
}

function inferFieldType(value: string, fieldName: string): string {
  if (fieldName === "image" || /\.(png|jpg|jpeg|webp)$/i.test(value)) return "IMAGE";
  if (value === "true" || value === "false") return "BOOLEAN";
  if (/^\d+$/.test(value) && !value.includes(".")) return "INT";
  return "STRING";
}

function isImageField(fieldName: string, value: string): boolean {
  return fieldName === "image" || /\.(png|jpg|jpeg|webp)$/i.test(value);
}
