import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";

const COVERS_DIR = path.join(process.cwd(), "public/images/covers");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/* ------------------------------------------------------------------ */
/*  SSRF 防护：仅允许 http/https + 禁止私网/回环地址                      */
/* ------------------------------------------------------------------ */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
]);

/** 检查是否为 IPv4 私网 / 链路本地 / 回环 */
function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||                          // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) ||          // 192.168.0.0/16
    a === 127 ||                          // 127.0.0.0/8
    (a === 169 && b === 254)             // 169.254.0.0/16 (link-local / cloud metadata)
  );
}

function validateUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  // 仅允许 http/https 协议
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  // 拒绝已知危险主机名
  if (BLOCKED_HOSTNAMES.has(parsed.hostname)) return null;

  // 拒绝 IPv4 私网地址
  if (isPrivateIPv4(parsed.hostname)) return null;

  // 拒绝 IPv6 地址（方括号包裹，如 [::1]）
  if (parsed.hostname.startsWith("[")) return null;

  return parsed;
}

/* ------------------------------------------------------------------ */
/*  流式下载：累计超限即中断                                             */
/* ------------------------------------------------------------------ */

async function downloadWithLimit(
  url: string,
  maxBytes: number,
  timeoutMs: number
): Promise<Buffer> {
  const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
  const MAX_REDIRECTS = 5;

  // 禁用 fetch 自动跟随重定向，手动处理并对每一跳重新做 SSRF 校验
  const startTime = Date.now();
  let currentUrl = url;
  let response: Response | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const elapsed = Date.now() - startTime;
    const remaining = timeoutMs - elapsed;
    if (remaining <= 0) {
      throw new Error("下载图片超时");
    }

    response = await fetch(currentUrl, {
      signal: AbortSignal.timeout(remaining),
      redirect: "manual",
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("location");
      // 释放重定向响应的 body，避免连接占用
      if (response.body) {
        response.body.cancel().catch(() => {});
      }

      if (!location) {
        throw new Error(`重定向缺少 Location: HTTP ${response.status}`);
      }

      // Location 可能是相对路径，需基于当前 URL 解析
      const next = new URL(location, currentUrl);
      const validatedNext = validateUrl(next.href);
      if (!validatedNext) {
        throw new Error("URL 无效或不允许访问该地址");
      }

      currentUrl = validatedNext.href;
      continue;
    }

    // 非重定向状态，跳出进入后续下载逻辑
    break;
  }

  if (!response) {
    throw new Error("远程服务未返回响应");
  }

  if (REDIRECT_STATUSES.has(response.status)) {
    throw new Error("重定向次数过多");
  }

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  // content-length 快速拒绝
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxBytes) {
    throw new Error("远程图片大小不能超过 10MB");
  }

  if (!response.body) {
    throw new Error("远程服务未返回数据");
  }

  // 流式读取，累计超限立即中断
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reader = Readable.fromWeb(response.body as any);
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of reader) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > maxBytes) {
      reader.destroy();
      throw new Error("远程图片大小不能超过 10MB");
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks, totalBytes);
}

/**
 * 封面图上传/处理 API
 * - multipart/form-data → 读取 file 字段
 * - application/json → { url: "https://..." } → fetch 下载
 * 统一处理：sharp resize(800) → webp(quality 80) → 写入 public/images/covers/{uuid}.webp
 */
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      let buffer: Buffer;
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        // 文件上传模式
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
          return NextResponse.json(
            { success: false, error: "未找到上传文件" },
            { status: 400 }
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { success: false, error: "文件大小不能超过 10MB" },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else if (contentType.includes("application/json")) {
        // URL 下载模式
        const body = await req.json();
        const { url } = body;

        if (!url || typeof url !== "string") {
          return NextResponse.json(
            { success: false, error: "请提供有效的图片 URL" },
            { status: 400 }
          );
        }

        // URL 验证 + SSRF 防护
        const validatedUrl = validateUrl(url);
        if (!validatedUrl) {
          return NextResponse.json(
            { success: false, error: "URL 无效或不允许访问该地址" },
            { status: 400 }
          );
        }

        try {
          buffer = await downloadWithLimit(validatedUrl.href, MAX_FILE_SIZE, 15_000);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "下载失败";
          return NextResponse.json(
            { success: false, error: msg },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: "不支持的 Content-Type" },
          { status: 400 }
        );
      }

      // 验证是否为有效图片
      const metadata = await sharp(buffer).metadata().catch(() => null);
      if (!metadata) {
        return NextResponse.json(
          { success: false, error: "无效的图片文件" },
          { status: 400 }
        );
      }

      // sharp 处理：resize 至 800px 宽 + webp 格式
      const processed = await sharp(buffer)
        .resize(800, undefined, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // 确保目录存在
      await mkdir(COVERS_DIR, { recursive: true });

      // 写入文件
      const filename = `${randomUUID()}.webp`;
      const filePath = path.join(COVERS_DIR, filename);
      await writeFile(filePath, processed);

      const publicUrl = `/images/covers/${filename}`;

      return NextResponse.json({
        success: true,
        data: { url: publicUrl },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "处理图片失败";
      return NextResponse.json(
        { success: false, error: msg },
        { status: 500 }
      );
    }
  });
}
