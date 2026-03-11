import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "./types";

function getSecret() {
  const key = process.env.JWT_SECRET;
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  return new TextEncoder().encode(key || "default-dev-secret-change-in-prod");
}

export async function signToken(payload: { sub: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { sub: string; username: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function withAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, admin: { sub: string; username: string }) => Promise<NextResponse<ApiResponse>>
): Promise<NextResponse<ApiResponse>> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: "登录已过期" }, { status: 401 });
  }

  return handler(req, payload);
}
