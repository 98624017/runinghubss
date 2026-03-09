import { createHmac, timingSafeEqual } from 'node:crypto';

import type { Request, Response } from 'express';

const SESSION_COOKIE_NAME = 'rh_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type SessionPayload = {
  adminId: number;
  username: string;
  expiresAt: number;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(secret: string, payload: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function parseCookieHeader(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=');
        if (separatorIndex === -1) {
          return [part, ''] as const;
        }
        return [part.slice(0, separatorIndex), part.slice(separatorIndex + 1)] as const;
      }),
  );
}

export function createAdminSessionManager(options: { secret: string; secure?: boolean }) {
  return {
    issue(response: Response, admin: { id: number; username: string }) {
      const payload: SessionPayload = {
        adminId: admin.id,
        username: admin.username,
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      const encodedPayload = encodeBase64Url(JSON.stringify(payload));
      const signature = signPayload(options.secret, encodedPayload);

      response.setHeader('Set-Cookie', [
        `${SESSION_COOKIE_NAME}=${encodedPayload}.${signature}; Path=/; HttpOnly; SameSite=Lax${
          options.secure ? '; Secure' : ''
        }; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
      ]);
    },

    clear(response: Response) {
      response.setHeader('Set-Cookie', [
        `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${
          options.secure ? '; Secure' : ''
        }; Max-Age=0`,
      ]);
    },

    read(request: Request): SessionPayload | null {
      const cookies = parseCookieHeader(request.header('cookie'));
      const token = cookies.get(SESSION_COOKIE_NAME);
      if (!token) {
        return null;
      }

      const [encodedPayload, signature] = token.split('.');
      if (!encodedPayload || !signature) {
        return null;
      }

      const expectedSignature = signPayload(options.secret, encodedPayload);
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const actualBuffer = Buffer.from(signature, 'utf8');
      if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
        return null;
      }

      try {
        const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
        if (!payload?.adminId || !payload?.username || payload.expiresAt <= Date.now()) {
          return null;
        }
        return payload;
      } catch {
        return null;
      }
    },
  };
}
