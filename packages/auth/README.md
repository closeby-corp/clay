# @close-by/clay-auth

Thin helpers for Clay apps: password hashing, login rate limiting, OpenID Connect single sign-on, `requireAuth` / `requireRole`, optional forced password change, and lightweight audit recording.

Not a full user database — pair with `ui.run({ authSecret })` signed cookies and your own user store.

```ts
import {
  hashPassword,
  verifyPassword,
  createLoginLimiter,
  createAuthGuards,
  auditRecord,
  createOidcLogin,
} from '@close-by/clay-auth';
```

**Single sign-on (OIDC):** `createOidcLogin({ issuer, clientId, redirectUri, onSignIn })` returns `/auth/login`, `/auth/callback` and `/auth/logout` routes for `ui.run({ authSecret, routes: sso.routes() })`. Authorization code + PKCE, ID token verified against the provider's keys, then Clay's normal signed cookie takes over. Start sign-in with `ui.redirect('/auth/login?returnTo=/path')`. Options are plain values (config file, secrets manager, env — your choice); the package reads no environment variables. See [docs/production.md](../../docs/production.md#single-sign-on-oidc).

**Process-local defaults:** `createLoginLimiter` keeps counters in memory, and `auditRecord` writes to in-process `ui.storage.app` (non-persisted by default). Fine for a single instance; for multi-instance deployments, back both with a shared store (for example Redis via `@close-by/clay-persistence-redis` for audit, and your own shared limiter).

See the Account demo (`apps/demo/src/examples/_auth.ts`) and [docs/examples.md](../../docs/examples.md).