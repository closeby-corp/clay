/**
 * OpenID Connect sign-in (authorization code + PKCE) for Clay apps.
 *
 * Works with any OpenID Connect provider.
 * The provider is only used to sign in: once the ID token checks out, Clay's own
 * signed auth cookie keeps the user signed in, so there is no token refresh.
 *
 * Plug the returned routes into `ui.run({ authSecret, routes })`.
 */

/** Verified ID token claims. */
export type OidcClaims = {
  sub: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
  nonce?: string;
  email?: string;
  name?: string;
  [claim: string]: unknown;
};

export type OidcLoginOptions = {
  /** Issuer URL; discovery is read from `${issuer}/.well-known/openid-configuration`. */
  issuer: string;
  clientId: string;
  /** Only for confidential clients (sent with HTTP Basic auth). */
  clientSecret?: string;
  /** Absolute URL of the callback route, as registered with the provider. */
  redirectUri: string;
  /** Default `['openid', 'email', 'profile']`. */
  scopes?: string[];
  /** Extra query params for the authorize request (e.g. `{ identity_provider: 'Google' }`). */
  authorizeParams?: Record<string, string>;
  /**
   * Map verified claims to the Clay user id. Return `null` to refuse sign-in.
   * Default: `claims.sub`. Use it to upsert the user in your store.
   */
  onSignIn?: (claims: OidcClaims) => string | null | Promise<string | null>;
  /**
   * Provider sign-out URL, given the absolute URL to return to. Default: discovery
   * `end_session_endpoint` (when present); without either, sign-out only clears the cookie.
   */
  logoutUrl?: (afterLogoutUrl: string) => string;
  /** Allowed clock skew in seconds. Default 60. */
  clockSkewSec?: number;
  /** Override `fetch` (tests). */
  fetch?: typeof fetch;
};

export type OidcRoutesOptions = {
  /** Default `/auth/login`. Accepts `?returnTo=/path`. */
  loginPath?: string;
  /** Default `/auth/callback`; must match the path of `redirectUri`. */
  callbackPath?: string;
  /** Default `/auth/logout`. */
  logoutPath?: string;
  /** Where to land after sign-in when no `returnTo` was given. Default `/`. */
  afterLogin?: string;
  /** App path after sign-out. Default `/`. */
  afterLogout?: string;
  /** App path when sign-in fails; `?auth_error=<code>` is appended. Default `/`. */
  errorPath?: string;
};

/** Structural match for `ClayRouteHandler` from `@close-by/clay-server`. */
export type OidcRouteHandler = (
  req: Request,
  ctx: {
    url: URL;
    signIn(userId: string, location: string): Response;
    signOut(location: string): Response;
  },
) => Response | Promise<Response>;

type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
};

type Jwk = JsonWebKey & { kid?: string };

const FLOW_COOKIE = 'clay-oidc';
const FLOW_MAX_AGE_SEC = 600;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function randomToken(bytes = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function pkceChallenge(verifier: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier))));
}

/** Only same-origin app paths; blocks `//evil.com` and `https://…`. */
export function safeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

function flowCookie(value: string, path: string, secure: boolean, maxAge = FLOW_MAX_AGE_SEC): string {
  const parts = [
    `${FLOW_COOKIE}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function withQuery(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return `${path}${path.includes('?') ? '&' : '?'}${qs}`;
}

export function createOidcLogin(options: OidcLoginOptions) {
  const doFetch = options.fetch ?? fetch;
  const issuer = options.issuer.replace(/\/+$/, '');
  const skew = options.clockSkewSec ?? 60;
  const secureCookie = options.redirectUri.startsWith('https:');
  let discovery: Promise<Discovery> | null = null;
  let jwks: Map<string, CryptoKey> | null = null;

  function discover(): Promise<Discovery> {
    discovery ??= (async () => {
      const res = await doFetch(`${issuer}/.well-known/openid-configuration`);
      if (!res.ok) throw new Error(`OIDC discovery failed (${res.status})`);
      return (await res.json()) as Discovery;
    })();
    discovery.catch(() => {
      discovery = null;
    });
    return discovery;
  }

  async function loadKeys(): Promise<Map<string, CryptoKey>> {
    const { jwks_uri } = await discover();
    const res = await doFetch(jwks_uri);
    if (!res.ok) throw new Error(`OIDC JWKS fetch failed (${res.status})`);
    const { keys } = (await res.json()) as { keys: Jwk[] };
    const map = new Map<string, CryptoKey>();
    for (const jwk of keys) {
      if (jwk.kty !== 'RSA' || !jwk.kid || (jwk.use && jwk.use !== 'sig')) continue;
      const key = await crypto.subtle.importKey(
        'jwk',
        { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      map.set(jwk.kid, key);
    }
    jwks = map;
    return map;
  }

  async function keyFor(kid: string): Promise<CryptoKey | undefined> {
    const cached = jwks?.get(kid);
    if (cached) return cached;
    // Unknown kid → the provider may have rotated keys.
    return (await loadKeys()).get(kid);
  }

  /** Verify an RS256 ID token's signature and standard claims. */
  async function verifyIdToken(token: string, expectedNonce: string): Promise<OidcClaims> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('malformed id_token');
    const [h, p, sig] = parts as [string, string, string];
    const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8')) as { alg?: string; kid?: string };
    if (header.alg !== 'RS256' || !header.kid) throw new Error('unsupported id_token alg');
    const key = await keyFor(header.kid);
    if (!key) throw new Error('unknown id_token key');
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      Buffer.from(sig, 'base64url'),
      enc.encode(`${h}.${p}`),
    );
    if (!ok) throw new Error('bad id_token signature');
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as OidcClaims;
    const now = Math.floor(Date.now() / 1000);
    const disc = await discover();
    if (claims.iss !== disc.issuer && claims.iss !== issuer) throw new Error('id_token issuer mismatch');
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(options.clientId)) throw new Error('id_token audience mismatch');
    if (typeof claims.exp !== 'number' || claims.exp + skew < now) throw new Error('id_token expired');
    if (typeof claims.iat === 'number' && claims.iat - skew > now) throw new Error('id_token issued in the future');
    if (claims.nonce !== expectedNonce) throw new Error('id_token nonce mismatch');
    if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('id_token missing sub');
    return claims;
  }

  async function exchangeCode(code: string, verifier: string): Promise<string> {
    const { token_endpoint } = await discover();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: options.redirectUri,
      client_id: options.clientId,
      code_verifier: verifier,
    });
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (options.clientSecret) {
      headers.Authorization = `Basic ${Buffer.from(
        `${encodeURIComponent(options.clientId)}:${encodeURIComponent(options.clientSecret)}`,
      ).toString('base64')}`;
    }
    const res = await doFetch(token_endpoint, { method: 'POST', headers, body });
    if (!res.ok) throw new Error(`token exchange failed (${res.status})`);
    const json = (await res.json()) as { id_token?: string };
    if (!json.id_token) throw new Error('token response missing id_token');
    return json.id_token;
  }

  function routes(opts: OidcRoutesOptions = {}): Record<string, OidcRouteHandler> {
    const loginPath = opts.loginPath ?? '/auth/login';
    const callbackPath = opts.callbackPath ?? new URL(options.redirectUri).pathname;
    const logoutPath = opts.logoutPath ?? '/auth/logout';
    const afterLogin = opts.afterLogin ?? '/';
    const afterLogout = opts.afterLogout ?? '/';
    const errorPath = opts.errorPath ?? '/';
    const fail = (_ctx: unknown, code: string) =>
      new Response(null, {
        status: 302,
        headers: { Location: withQuery(errorPath, { auth_error: code }), 'Cache-Control': 'no-store' },
      });

    return {
      [loginPath]: async (_req, { url }) => {
        let disc: Discovery;
        try {
          disc = await discover();
        } catch (err) {
          console.warn('[clay-auth] OIDC discovery failed:', err instanceof Error ? err.message : err);
          return fail(null, 'provider');
        }
        const state = randomToken();
        const nonce = randomToken();
        const verifier = randomToken(48);
        const returnTo = safeReturnTo(url.searchParams.get('returnTo'), afterLogin);
        const authorize = new URL(disc.authorization_endpoint);
        const params: Record<string, string> = {
          response_type: 'code',
          client_id: options.clientId,
          redirect_uri: options.redirectUri,
          scope: (options.scopes ?? ['openid', 'email', 'profile']).join(' '),
          state,
          nonce,
          code_challenge: await pkceChallenge(verifier),
          code_challenge_method: 'S256',
          ...options.authorizeParams,
        };
        for (const [k, v] of Object.entries(params)) authorize.searchParams.set(k, v);
        return new Response(null, {
          status: 302,
          headers: {
            Location: authorize.toString(),
            'Set-Cookie': flowCookie(
              JSON.stringify({ state, nonce, verifier, returnTo }),
              callbackPath,
              secureCookie,
            ),
            'Cache-Control': 'no-store',
          },
        });
      },

      [callbackPath]: async (req, ctx) => {
        const res = await (async () => {
          const q = ctx.url.searchParams;
          if (q.get('error')) return fail(ctx, q.get('error')!);
          let flow: { state: string; nonce: string; verifier: string; returnTo: string };
          try {
            flow = JSON.parse(readCookie(req, FLOW_COOKIE) ?? '');
          } catch {
            return fail(ctx, 'expired');
          }
          const state = q.get('state');
          const code = q.get('code');
          if (!state || !code || state !== flow.state) return fail(ctx, 'state');
          let claims: OidcClaims;
          try {
            claims = await verifyIdToken(await exchangeCode(code, flow.verifier), flow.nonce);
          } catch (err) {
            console.warn('[clay-auth] OIDC sign-in failed:', err instanceof Error ? err.message : err);
            return fail(ctx, 'invalid_token');
          }
          const userId = options.onSignIn ? await options.onSignIn(claims) : claims.sub;
          if (!userId) return fail(ctx, 'denied');
          return ctx.signIn(userId, safeReturnTo(flow.returnTo, afterLogin));
        })();
        // One-shot: drop the flow cookie whatever happened.
        res.headers.append('Set-Cookie', flowCookie('', callbackPath, secureCookie, 0));
        return res;
      },

      [logoutPath]: async (_req, ctx) => {
        const back = new URL(afterLogout, options.redirectUri).toString();
        let target = afterLogout;
        if (options.logoutUrl) {
          target = options.logoutUrl(back);
        } else {
          const disc = await discover().catch(() => null);
          if (disc?.end_session_endpoint) {
            const u = new URL(disc.end_session_endpoint);
            u.searchParams.set('client_id', options.clientId);
            u.searchParams.set('post_logout_redirect_uri', back);
            target = u.toString();
          }
        }
        return ctx.signOut(target);
      },
    };
  }

  return { routes, verifyIdToken, discover };
}
