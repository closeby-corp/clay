import { createHmac, timingSafeEqual } from 'node:crypto';

/** HttpOnly cookie carrying a signed auth token. */
export const AUTH_COOKIE_NAME = 'badui-auth';

/** Minimal context for cookie-based resolveUserId (matches server hello hook). */
export type AuthResolveUserIdContext = {
  helloUserId?: string;
  headers: Headers;
  path: string;
};

export type AuthCookieOptions = {
  /** HMAC secret (required to sign / verify). */
  secret: string;
  /** Cookie Max-Age in seconds. Default 12 hours. */
  maxAgeSec?: number;
  /** Cookie Path. Default `/`. */
  path?: string;
  /** Override SameSite. Default `Lax`. */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** Force Secure flag (default: true when SameSite=None). */
  secure?: boolean;
};

const DEFAULT_MAX_AGE_SEC = 12 * 60 * 60;

function base64url(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(value: string): Buffer | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    return Buffer.from(padded + pad, 'base64');
  } catch {
    return null;
  }
}

function hmac(secret: string, payload: string): Buffer {
  return createHmac('sha256', secret).update(payload, 'utf8').digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Sign a short-lived auth token for `userId`.
 * Format: `base64url(userId|issuedAt).base64url(hmac)`.
 */
export function signAuthToken(
  userId: string,
  secret: string,
  issuedAt = Date.now(),
): string {
  if (!userId || !secret) {
    throw new Error('signAuthToken requires userId and secret');
  }
  if (userId.includes('|') || userId.includes('\n')) {
    throw new Error('userId must not contain | or newlines');
  }
  const payload = `${userId}|${issuedAt}`;
  return `${base64url(payload)}.${base64url(hmac(secret, payload))}`;
}

/** Verify a signed token; returns userId or null. */
export function verifyAuthToken(
  token: string,
  secret: string,
  opts?: { maxAgeMs?: number; now?: number },
): string | null {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const payloadBuf = fromBase64url(payloadB64);
  const sigBuf = fromBase64url(sigB64);
  if (!payloadBuf || !sigBuf) return null;

  const payload = payloadBuf.toString('utf8');
  const expected = hmac(secret, payload);
  if (!safeEqual(sigBuf, expected)) return null;

  const sep = payload.lastIndexOf('|');
  if (sep <= 0) return null;
  const userId = payload.slice(0, sep);
  const issuedAt = Number(payload.slice(sep + 1));
  if (!userId || !Number.isFinite(issuedAt)) return null;

  const maxAgeMs = opts?.maxAgeMs ?? DEFAULT_MAX_AGE_SEC * 1000;
  const now = opts?.now ?? Date.now();
  if (now - issuedAt > maxAgeMs || issuedAt > now + 60_000) return null;

  return userId;
}

/** Parse `name=value` pairs from a Cookie header. */
export function parseCookieHeader(
  header: string | null | undefined,
): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim();
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(raw);
    } catch {
      out[name] = raw;
    }
  }
  return out;
}

export function readAuthCookie(
  headers: Headers,
  cookieName = AUTH_COOKIE_NAME,
): string | null {
  const cookies = parseCookieHeader(headers.get('cookie'));
  return cookies[cookieName] ?? null;
}

/** Resolve trusted user id from the signed auth cookie (Wave 1 helper). */
export function resolveUserIdFromAuthCookie(
  secret: string,
  opts?: { cookieName?: string; maxAgeMs?: number },
): (ctx: AuthResolveUserIdContext) => string | null {
  const cookieName = opts?.cookieName ?? AUTH_COOKIE_NAME;
  return ({ headers }) => {
    const token = readAuthCookie(headers, cookieName);
    if (!token) return null;
    return verifyAuthToken(token, secret, { maxAgeMs: opts?.maxAgeMs });
  };
}

function buildSetCookie(
  name: string,
  value: string,
  opts: {
    maxAgeSec: number;
    path: string;
    sameSite: 'Strict' | 'Lax' | 'None';
    secure?: boolean;
    clear?: boolean;
  },
): string {
  const parts = [
    `${name}=${opts.clear ? '' : encodeURIComponent(value)}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.clear ? 0 : opts.maxAgeSec}`,
    `SameSite=${opts.sameSite}`,
    'HttpOnly',
  ];
  const secure = opts.secure ?? opts.sameSite === 'None';
  if (secure) parts.push('Secure');
  if (opts.clear) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return parts.join('; ');
}

export function authSessionSetCookieHeader(
  token: string,
  options: AuthCookieOptions,
): string {
  return buildSetCookie(AUTH_COOKIE_NAME, token, {
    maxAgeSec: options.maxAgeSec ?? DEFAULT_MAX_AGE_SEC,
    path: options.path ?? '/',
    sameSite: options.sameSite ?? 'Lax',
    secure: options.secure,
  });
}

export function authSessionClearCookieHeader(
  options?: Pick<AuthCookieOptions, 'path' | 'sameSite' | 'secure'>,
): string {
  return buildSetCookie(AUTH_COOKIE_NAME, '', {
    maxAgeSec: 0,
    path: options?.path ?? '/',
    sameSite: options?.sameSite ?? 'Lax',
    secure: options?.secure,
    clear: true,
  });
}

/** Handle `POST /auth/session` — body `{ token }` (server-issued signed token). */
export async function handleAuthSessionPost(
  req: Request,
  options: AuthCookieOptions,
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const token =
    body && typeof body === 'object' && typeof (body as { token?: unknown }).token === 'string'
      ? (body as { token: string }).token
      : null;
  if (!token) {
    return Response.json({ error: 'token required' }, { status: 400 });
  }
  const maxAgeMs = (options.maxAgeSec ?? DEFAULT_MAX_AGE_SEC) * 1000;
  const userId = verifyAuthToken(token, options.secret, { maxAgeMs });
  if (!userId) {
    return Response.json({ error: 'invalid token' }, { status: 401 });
  }
  // Re-sign so cookie issuedAt is fresh at establish time.
  const cookieToken = signAuthToken(userId, options.secret);
  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': authSessionSetCookieHeader(cookieToken, options),
    },
  });
}

/** Handle `DELETE /auth/session`. */
export function handleAuthSessionDelete(
  options?: Pick<AuthCookieOptions, 'path' | 'sameSite' | 'secure'>,
): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': authSessionClearCookieHeader(options),
    },
  });
}
