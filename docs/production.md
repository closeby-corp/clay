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
import { requireRole } from '@close-by/clay-auth';

ui.run({
  authSecret: process.env.CLAY_AUTH_SECRET!,
  app: {
    title: 'Hub',
    nav: () => ui.navFromPages({ role: currentUser.role }),
  },
});

ui.page('/admin', () => {
  requireRole('admin');
  // …
});
```

- `pageMeta.roles` — hide nav items via `ui.navFromPages({ role })` (UX only)
- `requireRole` / guards in the page builder — **enforce** access before building sensitive UI
- See [API — auth](./api.md), `/examples/auth`, and [Ops patterns — auth nav](./ops-patterns.md#auth--role-filtered-nav)

Nav filtering is not authorization. Always guard pages that must not leak data.

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
