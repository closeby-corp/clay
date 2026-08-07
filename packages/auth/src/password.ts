import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_ITERATIONS = 100_000;
const KEY_LEN = 32;
const DIGEST = 'sha256';

/**
 * Hash a password with PBKDF2-HMAC-SHA256.
 * Stored format: `pbkdf2$iterations$saltB64$hashB64`.
 */
export function hashPassword(
  password: string,
  opts?: { iterations?: number; salt?: Buffer },
): string {
  const iterations = opts?.iterations ?? DEFAULT_ITERATIONS;
  const salt = opts?.salt ?? randomBytes(16);
  const hash = pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST);
  return `pbkdf2$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/** Verify a password against a {@link hashPassword} digest. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[2]!, 'base64');
    expected = Buffer.from(parts[3]!, 'base64');
  } catch {
    return false;
  }
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, DIGEST);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
