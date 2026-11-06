import { describe, expect, test } from 'bun:test';
import { createOidcLogin, safeReturnTo, type OidcRouteHandler } from './oidc';

const ISSUER = 'https://idp.test';
const CLIENT = 'client-1';
const REDIRECT = 'http://localhost:3000/auth/callback';

async function fakeProvider() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: 'k1', use: 'sig' };
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const sign = async (claims: Record<string, unknown>, kid = 'k1') => {
    const input = `${b64({ alg: 'RS256', kid })}.${b64(claims)}`;
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(input));
    return `${input}.${Buffer.from(sig).toString('base64url')}`;
  };
  const state = { claimsOverride: {} as Record<string, unknown>, lastToken: null as URLSearchParams | null, nonce: '' };
  const fetchImpl = (async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/.well-known/openid-configuration')) {
      return Response.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        jwks_uri: `${ISSUER}/jwks`,
      });
    }
    if (url === `${ISSUER}/jwks`) return Response.json({ keys: [jwk] });
    if (url === `${ISSUER}/token`) {
      state.lastToken = new URLSearchParams(String(init?.body));
      const now = Math.floor(Date.now() / 1000);
      return Response.json({
        id_token: await sign({ iss: ISSUER, aud: CLIENT, sub: 'user-42', email: 'a@b.c', exp: now + 300, iat: now, nonce: state.nonce, ...state.claimsOverride }),
      });
    }
    return new Response('nope', { status: 404 });
  }) as typeof fetch;
  return { fetchImpl, state };
}

const ctxFor = (url: string) => ({
  url: new URL(url),
  signIn: (userId: string, location: string) =>
    new Response(null, { status: 302, headers: { Location: location, 'X-User': userId } }),
  signOut: (location: string) => new Response(null, { status: 302, headers: { Location: location, 'X-Out': '1' } }),
});

async function runFlow(opts: { tamperState?: boolean; claims?: Record<string, unknown>; onSignIn?: (c: { sub: string }) => string | null; returnTo?: string } = {}) {
  const p = await fakeProvider();
  p.state.claimsOverride = opts.claims ?? {};
  const oidc = createOidcLogin({ issuer: ISSUER, clientId: CLIENT, redirectUri: REDIRECT, fetch: p.fetchImpl, onSignIn: opts.onSignIn });
  const r = oidc.routes();
  const login = r['/auth/login'] as OidcRouteHandler;
  const callback = r['/auth/callback'] as OidcRouteHandler;
  const loginUrl = `http://localhost:3000/auth/login${opts.returnTo ? `?returnTo=${encodeURIComponent(opts.returnTo)}` : ''}`;
  const res1 = await login(new Request(loginUrl), ctxFor(loginUrl));
  const authorize = new URL(res1.headers.get('location')!);
  const cookie = res1.headers.get('set-cookie')!.split(';')[0]!;
  p.state.nonce = authorize.searchParams.get('nonce')!;
  const st = opts.tamperState ? 'wrong' : authorize.searchParams.get('state')!;
  const cbUrl = `${REDIRECT}?code=abc&state=${st}`;
  const res2 = await callback(new Request(cbUrl, { headers: { cookie } }), ctxFor(cbUrl));
  return { authorize, res1, res2, provider: p };
}

describe('createOidcLogin', () => {
  test('full code + PKCE flow signs in as sub', async () => {
    const { authorize, res2, provider } = await runFlow({ returnTo: '/reports' });
    expect(authorize.origin + authorize.pathname).toBe(`${ISSUER}/authorize`);
    expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');
    expect(provider.state.lastToken?.get('code_verifier')?.length).toBeGreaterThan(40);
    expect(res2.headers.get('x-user')).toBe('user-42');
    expect(res2.headers.get('location')).toBe('/reports');
    expect(res2.headers.getSetCookie().some((c) => c.startsWith('clay-oidc=;'))).toBe(true);
  });

  test('state mismatch is refused', async () => {
    const { res2 } = await runFlow({ tamperState: true });
    expect(res2.headers.get('x-user')).toBeNull();
    expect(res2.headers.get('location')).toBe('/?auth_error=state');
  });

  test.each([
    ['wrong audience', { aud: 'other' }],
    ['wrong issuer', { iss: 'https://evil.test' }],
    ['expired', { exp: 1000 }],
    ['wrong nonce', { nonce: 'x' }],
  ])('%s token is refused', async (_name, claims) => {
    const { res2 } = await runFlow({ claims });
    expect(res2.headers.get('x-user')).toBeNull();
    expect(res2.headers.get('location')).toBe('/?auth_error=invalid_token');
  });

  test('onSignIn maps or denies', async () => {
    expect((await runFlow({ onSignIn: (c) => `u:${c.sub}` })).res2.headers.get('x-user')).toBe('u:user-42');
    expect((await runFlow({ onSignIn: () => null })).res2.headers.get('location')).toBe('/?auth_error=denied');
  });

  test('open redirects are blocked', () => {
    expect(safeReturnTo('//evil.com', '/')).toBe('/');
    expect(safeReturnTo('https://evil.com', '/')).toBe('/');
    expect(safeReturnTo('/ok?x=1', '/')).toBe('/ok?x=1');
  });

  test('logoutUrl option builds the provider sign-out url', async () => {
    const o = createOidcLogin({ issuer: ISSUER, clientId: CLIENT, redirectUri: REDIRECT, logoutUrl: (back) => `${ISSUER}/logout?to=${encodeURIComponent(back)}`, fetch: (async () => new Response('', { status: 500 })) as unknown as typeof fetch });
    const res = await (o.routes()['/auth/logout'] as OidcRouteHandler)(new Request('http://localhost:3000/auth/logout'), ctxFor('http://localhost:3000/auth/logout'));
    expect(res.headers.get('x-out')).toBe('1');
    expect(res.headers.get('location')).toBe(`${ISSUER}/logout?to=http%3A%2F%2Flocalhost%3A3000%2F`);
  });

});
