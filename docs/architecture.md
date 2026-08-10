# Architecture

## Package responsibilities

| Package | Role |
|---------|------|
| `@clay/ui` | App-facing `ui` object: factories, `page`, `loadPages`, `navFromPages`, `run` |
| `@clay/cli` | `clay` binary: run a `.ts` file or page directory with sane defaults |
| `@clay/components` | Thin `Element` factories (no HTML strings) |
| `@clay/core` | Element tree, session, page wrapper, reactive, protocol, `storage` (`tab` / `user` / `app`) + PersistenceAdapter |
| `@clay/persistence-file` | File-backed `PersistenceAdapter` for `storage.configure` |
| `@clay/server` | Bun.serve: static SPA assets + `/ws` upgrade, `/auth/session`, session timeouts |
| `@clay/auth` | Optional helpers: password hash, login limiter, `requireAuth` / `requireRole`, `auditRecord` |
| `@clay/client` | Vite/React app: WS session hook + element → ShadCN (Sonner, BoundDataTable, …). **Private** — build output is copied into `@clay/cli` via `bun run build:client` / `pack:publishable`. |

`@clay/compiler` (old Datastar `let` transform) was removed; compile-time reactive `let` remains a Later backlog item.

## Runtime data flow

```
clay <file|dir> ──► import / loadPages
        │
ui.run({ app? }) ──► setPageWrapper(app shell)
        │
        ▼
ClayServer ──HTTP──► SPA shell (index.html + assets)
```

Or library entry:

```
ui.loadPages(dir) ──► ui.page registrations + pageMeta
        │
ui.run({ app }) ──► setPageWrapper(app shell)
        │
        ▼
ClayServer ──HTTP──► SPA shell (index.html + assets)
        │
        └──WS /ws──► ClientSession
                        │
                        ├─ mount: wrapper? → builder() → Element tree → JSON
                        ├─ event: element.handleEvent → handlers
                        └─ patch: updateProps / setChildren / …
                                    │
                                    ▼
                         React useClaySession + ElementRenderer
                         (notify → Sonner toast)
```

## Ownership boundaries

- **Server** owns truth for structure and business state.
- **Client** owns presentation and optimistic form UX.
- **Handlers never run in the browser**; only event names and values cross the wire.

## Session lifecycle

1. Upgrade to WebSocket; `data.session = null`
2. On first `hello`, `new ClientSession(path, send)` → `mount()`
3. Page path change → destroy previous session, mount new path (same socket; client sends another `hello`)
4. Socket close → `session.destroy()`

On the client, a durable WebSocket + sticky React key for `type: 'app'` keeps sidebar/header mounted across navigate when chrome identity matches; only the inset tree remounts.

Per-tab isolation: local `let` / `reactive` state inside a page builder is not shared across tabs. Use `ui.storage.app` when you need a process-wide store. Optional `PersistenceAdapter` (via `storage.configure({ app })` or `ui.run({ appStorageDir })`) persists keys by default; `{ persist: false }` keeps a key in memory only. Use `createFilePersistence` from `@clay/persistence-file` for disk-backed JSON, or bring your own adapter. Persisted `get()` always reloads from the adapter.

## Extending the system

### New element type

1. Add a factory in `packages/components/src/index.ts` (`new Element('myType', props)`).
2. Re-export via `packages/ui/src/index.ts` on the `ui` object.
3. Add a `case 'myType':` in `packages/client/src/ElementRenderer.tsx`.
4. Rebuild the client (`bun run build:client`).

### Custom server

```typescript
import { ClayServer } from '@clay/server';
import { setPageWrapper } from '@clay/core';
import { app } from '@clay/components';
import './pages';

setPageWrapper((pageFn) =>
  app({ title: 'App', nav: [{ label: 'Home', href: '/' }] }, pageFn),
);

const server = new ClayServer({ port: 4000, title: 'App' });
server.start();
```

Or use `ui.run({ app, … })` which sets the page wrapper and starts the server.

## Retired stack

The previous Datastar + DaisyUI + SSE signal-sync architecture is removed:

- No `/clay/stream` or `/clay/events`
- No DaisyUI CDN page template
- No signal cache / PatchBus as the primary update path
- Compiler preload (`bunfig.toml`) removed

Historical notes may remain under `iterations/`.
