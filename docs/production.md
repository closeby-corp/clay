# Production & security

Clay apps are **server-driven**: page builders and most event handlers run in your Bun process. Every button click, input change, and timer tick can hit server code. Treat Clay like a web API plus UI, not a static site.

## Server exposure

| Fact | Implication |
|------|-------------|
| WebSocket + HTTP to one Bun process | Scale horizontally only with shared session/storage adapters; rate-limit at the edge or in middleware |
| Page code runs with full server privileges | Never expose unauthenticated Clay hubs to the public internet without hardening |
| No built-in multi-tenant isolation | One process serves all connected clients; use auth + per-user data in handlers |

**Defaults that fit internal ops tools:** VPN or private network, single-team auth, read-heavy dashboards.

## Authentication

Clay ships hooks for real identity beyond anonymous `userId`:

```ts
import { ui } from '@close-by/clay';
import { getCurrentSession } from '@close-by/clay-core';
import { resolveUserIdFromAuthCookie } from '@close-by/clay-server';
import { createAuthGuards } from '@close-by/clay-auth';

type User = { role: 'admin' | 'member' };
const userById = new Map<string, User>(); // Your app's user store, keyed by user ID.
const authSecret = process.env.CLAY_AUTH_SECRET!;
const anonymousUserId = '__clay_anonymous__';
const resolveSignedUserId = resolveUserIdFromAuthCookie(authSecret);

function getSessionUser(): User | null {
  const userId = getCurrentSession()?.userId;
  if (!userId || userId === anonymousUserId) return null;
  return userById.get(userId) ?? null;
}

const { requireRole } = createAuthGuards({
  getUser: getSessionUser,
  onUnauthenticated: () => ui.navigate('/login'),
});

ui.run({
  authSecret,
  resolveUserId: (context) => resolveSignedUserId(context) ?? anonymousUserId,
  app: {
    title: 'Hub',
    get nav() {
      const user = getSessionUser();
      return ui.navFromPages(user ? { role: user.role } : {});
    },
  },
});

ui.page('/admin', () => {
  if (!requireRole('admin')) return;
  // …
});
```

`get nav()` is evaluated while each page shell is built, so it filters routes for the current session. Reserve `__clay_anonymous__` outside `userById`: the resolver substitutes it for missing or invalid cookies, and `getSessionUser` treats it as signed out. Replace `userById` with your app's user store.

- `pageMeta.roles` — hide nav items via `ui.navFromPages({ role })` (UX only)
- `requireRole` / guards in the page builder — **enforce** access before building sensitive UI
- See [API — auth](./api.md), `/examples/auth`, and [Ops patterns — auth nav](./ops-patterns.md#auth--role-filtered-nav)

Nav filtering is not authorization. Always guard pages that must not leak data.

### Role-based content

Tell Clay how to read the current user's roles once, then show or hide parts of a page by role:

```ts
ui.run({
  authSecret,
  getRoles: () => getSessionUser()?.roles ?? [], // string, string[] or null
});

ui.page('/projects', () => {
  if (!requireAuth()) return;

  ui.forRoles(['admin', 'manager'], () => {
    ui.button('Delete project', { onClick: deleteProject });
    ui.dataTable(auditRows);
  }, () => ui.label('Ask an admin for access')); // optional fallback

  ui.button('Approve', { onClick: approve }).roles(['admin']);
  if (ui.hasRole('admin')) { /* plain check */ }
});
```

- Checks run on the server while the page builds. Hidden content is never sent to the browser, and its handlers don't exist, so they can't be triggered.
- With `getRoles` set, `ui.navFromPages()` (no arguments) and `requireRole(...)` use the same roles — no need to pass them separately.
- Roles are read when the page builds. Signing in or out reconnects and rebuilds, so the UI follows. A role changed while someone is signed in applies on their next page load.
- Without `getRoles`, role checks treat the user as having no roles (fail closed) and log a warning once.
- Still check the role inside handlers that change data — cheap protection against mistakes elsewhere.

## Single sign-on (OIDC)

`@close-by/clay-auth` signs users in with any OpenID Connect provider (authorization code + PKCE). The provider is only used to sign in: once its ID token is verified, Clay sets its usual signed auth cookie, so everything above (`resolveUserId`, guards, idle expiry) works unchanged and there are no provider tokens to refresh.

```ts
import { createOidcLogin } from '@close-by/clay-auth';

const sso = createOidcLogin({
  issuer: process.env.OIDC_ISSUER!, // discovery: ${issuer}/.well-known/openid-configuration
  clientId: process.env.OIDC_CLIENT_ID!,
  clientSecret: process.env.OIDC_CLIENT_SECRET, // only for confidential clients
  redirectUri: 'https://hub.example.com/auth/callback',
  async onSignIn(claims) {
    // Upsert your user; return the Clay user id, or null to refuse.
    await users.upsert(claims.sub, { email: claims.email });
    return claims.sub;
  },
});

ui.run({
  authSecret: process.env.CLAY_AUTH_SECRET!,
  routes: sso.routes({ afterLogin: '/', afterLogout: '/login', errorPath: '/login' }),
});

// Sign-in button (full page load — the route redirects to the provider):
ui.button('Sign in', { onClick: () => ui.redirect('/auth/login?returnTo=/reports') });
// Sign-out (clears the cookie, then signs out at the provider):
ui.button('Sign out', { onClick: () => ui.redirect('/auth/logout') });
```

All options are plain values — `process.env` above is just one source. Pass strings from a config file, a secrets manager, or literals; the library reads no environment variables itself. Keep `clientSecret` and `authSecret` out of source control.

Routes: `GET /auth/login` (accepts `?returnTo=/path`, same-origin paths only) → provider → `GET /auth/callback` → cookie set → `returnTo`. `GET /auth/logout` clears the cookie and goes to the provider's sign-out. Failures land on `errorPath?auth_error=<state|expired|invalid_token|denied|provider|…>`.

What is checked: `state` (one-shot HttpOnly cookie scoped to the callback path, 10 min), PKCE `S256`, ID token RS256 signature against the provider's JWKS (re-fetched on unknown `kid`), `iss`, `aud`, `exp`/`iat` (60 s skew), and `nonce`.

**Provider setup:** register an app/client that allows the authorization code flow with scopes `openid email profile`, callback URL `https://<host>/auth/callback`, and sign-out return URL `https://<host><afterLogout>`. Map roles from whatever claim your provider puts groups in, inside `onSignIn`.

**Sign-out:** uses the discovery `end_session_endpoint` when the provider has one. Otherwise pass `logoutUrl: (returnTo) => '…'` with the provider's sign-out URL; without either, sign-out only clears Clay's cookie.

**Behind an authenticating proxy:** if a reverse proxy or load balancer already signs users in and forwards a signed identity header, skip the routes and read (and verify) that header in `resolveUserId`.

The demo (which, unlike the library, reads env variables for convenience) enables a "Sign in with SSO" button on `/examples/auth/login` when `OIDC_ISSUER` and `OIDC_CLIENT_ID` are set (see `apps/demo/src/examples/_oidc.ts` for the optional variables).

## Rate limits & abuse

Clay does not ship a global rate limiter. For handlers that trigger expensive work (ClickHouse queries, re-dispatch, file export):

- Keep queries bounded (limits, time windows)
- Use app-level throttling/debounce on hot actions
- Put the hub behind a reverse proxy with rate limits if exposed beyond VPN

## Sensitive data in UI

Logs, traces, and config payloads may contain secrets. Clay provides `ui.codeBlock({ sensitive: true })` to reduce shoulder-surfing; **scrubbing before display is still the app's job**. See [Ops patterns — sensitive bodies](./ops-patterns.md#logs--traces--sensitive-bodies).

## Boot parity (CLI vs library)

Production should use **library mode** (`ui.run`) with the same port, CSS, and flags as dev CLI. Checklist: [Boot: CLI vs library](./boot.md).

| Setting | CLI | Library |
|---------|-----|---------|
| Port | `-p` / `_run.ts` | `ui.run({ port })` |
| CSS | `_run.ts` → `css` | `ui.run({ css })` |
| Client assets | bundled `clientDir` | `resolveClayClientDir()` |
| Reactive-let | `--reactive-let` (opt-in) | off unless you register the plugin |
| Reload stubs | `.clay-reload/` (gitignored) | N/A in prod |

## Related

- [Browser APIs](./browser-apis.md) — never `window` / `navigator` in page code
- [Concepts — canonical recipe](./concepts.md#canonical-recipe-state--auto--timer)
- [Reactive let — decision table](./reactive-let.md#decision-table-complex-pages)
