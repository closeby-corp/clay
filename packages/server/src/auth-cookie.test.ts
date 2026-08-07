import { describe, expect, test } from 'bun:test';
import {
  AUTH_COOKIE_NAME,
  authSessionClearCookieHeader,
  authSessionSetCookieHeader,
  handleAuthSessionDelete,
  handleAuthSessionPost,
  parseCookieHeader,
  readAuthCookie,
  resolveUserIdFromAuthCookie,
  signAuthToken,
  verifyAuthToken,
} from './auth-cookie';

const SECRET = 'test-secret-key';

describe('signAuthToken / verifyAuthToken', () => {
  test('round-trips userId', () => {
    const token = signAuthToken('alice', SECRET);
    expect(verifyAuthToken(token, SECRET)).toBe('alice');
  });

  test('rejects tampered payload', () => {
    const token = signAuthToken('alice', SECRET);
    const [payload] = token.split('.');
    const bob = signAuthToken('bob', SECRET);
    const bobSig = bob.split('.')[1]!;
    // alice payload + bob signature
    expect(verifyAuthToken(`${payload}.${bobSig}`, SECRET)).toBeNull();
  });

  test('rejects wrong secret', () => {
    const token = signAuthToken('alice', SECRET);
    expect(verifyAuthToken(token, 'other')).toBeNull();
  });

  test('rejects expired token', () => {
    const token = signAuthToken('alice', SECRET, Date.now() - 60_000);
    expect(verifyAuthToken(token, SECRET, { maxAgeMs: 1_000 })).toBeNull();
  });

  test('rejects userId with pipe', () => {
    expect(() => signAuthToken('a|b', SECRET)).toThrow();
  });
});

describe('cookie helpers', () => {
  test('parseCookieHeader decodes values', () => {
    expect(parseCookieHeader(`a=1; ${AUTH_COOKIE_NAME}=hello%2Fworld`)).toEqual({
      a: '1',
      [AUTH_COOKIE_NAME]: 'hello/world',
    });
  });

  test('resolveUserIdFromAuthCookie reads trusted cookie', () => {
    const token = signAuthToken('bob', SECRET);
    const resolve = resolveUserIdFromAuthCookie(SECRET);
    const headers = new Headers({
      cookie: `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    });
    expect(resolve({ headers, path: '/' })).toBe('bob');
    expect(readAuthCookie(headers)).toBe(token);
  });

  test('resolveUserIdFromAuthCookie returns null without cookie', () => {
    const resolve = resolveUserIdFromAuthCookie(SECRET);
    expect(resolve({ headers: new Headers(), path: '/' })).toBeNull();
  });

  test('Set-Cookie / clear headers', () => {
    const set = authSessionSetCookieHeader('tok', { secret: SECRET, maxAgeSec: 60 });
    expect(set).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(set).toContain('HttpOnly');
    expect(set).toContain('Max-Age=60');
    const clear = authSessionClearCookieHeader();
    expect(clear).toContain('Max-Age=0');
  });
});

describe('POST/DELETE /auth/session handlers', () => {
  test('POST sets cookie for valid token', async () => {
    const token = signAuthToken('alice', SECRET);
    const res = await handleAuthSessionPost(
      new Request('http://localhost/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }),
      { secret: SECRET },
    );
    expect(res.status).toBe(204);
    const setCookie = res.headers.get('Set-Cookie') ?? '';
    expect(setCookie).toContain(AUTH_COOKIE_NAME);
    expect(setCookie).toContain('HttpOnly');
  });

  test('POST rejects invalid token', async () => {
    const res = await handleAuthSessionPost(
      new Request('http://localhost/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'nope' }),
      }),
      { secret: SECRET },
    );
    expect(res.status).toBe(401);
  });

  test('DELETE clears cookie', () => {
    const res = handleAuthSessionDelete();
    expect(res.status).toBe(204);
    expect(res.headers.get('Set-Cookie') ?? '').toContain('Max-Age=0');
  });
});
