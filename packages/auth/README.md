# @badui/auth

Thin helpers for BadUI apps: password hashing, login rate limiting, `requireAuth` / `requireRole`, optional forced password change, and lightweight audit recording.

Not a full user database — pair with `ui.run({ authSecret })` signed cookies and your own user store.

```ts
import {
  hashPassword,
  verifyPassword,
  createLoginLimiter,
  createAuthGuards,
  auditRecord,
} from '@badui/auth';
```

**Process-local defaults:** `createLoginLimiter` keeps counters in memory, and `auditRecord` writes to in-process `ui.storage.app` (non-persisted by default). Fine for a single instance; for multi-instance deployments, back both with a shared store (for example Redis via `@badui/persistence-redis` for audit, and your own shared limiter).

See the Account demo (`apps/demo/src/examples/_auth.ts`) and [docs/examples.md](../../docs/examples.md).