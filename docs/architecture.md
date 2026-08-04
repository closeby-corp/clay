# Architecture

## Package responsibilities

| Package | Role |
|---------|------|
| `@badui/ui` | App-facing `ui` object: factories, `page`, `loadPages`, `navFromPages`, `run` |
| `@badui/components` | Thin `Element` factories (no HTML strings) |
| `@badui/core` | Element tree, session, page wrapper, reactive, protocol, GlobalState + PersistenceAdapter |
| `@badui/server` | Bun.serve: static SPA assets + `/ws` upgrade |
| `@badui/client` | Vite/React app: WS session hook + element → ShadCN (Sonner, BoundDataTable, …) |
| `@badui/compiler` | Stub / retired (old Datastar `let` transform) |

## Runtime data flow

```
ui.loadPages(dir) ──► ui.page registrations + pageMeta
        │
ui.run({ app }) ──► setPageWrapper(app shell)
        │
        ▼
BadUIServer ──HTTP──► SPA shell (index.html + assets)
        │
        └──WS /ws──► ClientSession
                        │
                        ├─ mount: wrapper? → builder() → Element tree → JSON
                        ├─ event: element.handleEvent → handlers
                        └─ patch: updateProps / setChildren / …
                                    │
                                    ▼
                         React useBadUISession + ElementRenderer
                         (notify → Sonner toast)
```

## Ownership boundaries

- **Server** owns truth for structure and business state.
- **Client** owns presentation and optimistic form UX.
- **Handlers never run in the browser**; only event names and values cross the wire.

## Session lifecycle

1. Upgrade to WebSocket; `data.session = null`
2. On first `hello`, `new ClientSession(path, send)` → `mount()`
3. Page path change → destroy previous session, mount new path
4. Socket close → `session.destroy()`

Per-tab isolation: local `let` / `reactive` state inside a page builder is not shared across tabs. Use `GlobalState` when you need a process-wide store. Optional `PersistenceAdapter` (configure at entrypoint) persists keys by default; `{ persist: false }` keeps a key in memory only. Persisted `get()` always reloads from the adapter.

## Extending the system

### New element type

1. Add a factory in `packages/components/src/index.ts` (`new Element('myType', props)`).
2. Re-export via `packages/ui/src/index.ts` on the `ui` object.
3. Add a `case 'myType':` in `packages/client/src/ElementRenderer.tsx`.
4. Rebuild the client (`bun run build:client`).

### Custom server

```typescript
import { BadUIServer } from '@badui/server';
import { setPageWrapper } from '@badui/core';
import { app } from '@badui/components';
import './pages';

setPageWrapper((pageFn) =>
  app({ title: 'App', nav: [{ label: 'Home', href: '/' }] }, pageFn),
);

const server = new BadUIServer({ port: 4000, title: 'App' });
server.start();
```

Or use `ui.run({ app, … })` which sets the page wrapper and starts the server.

## Retired stack

The previous Datastar + DaisyUI + SSE signal-sync architecture is removed:

- No `/badui/stream` or `/badui/events`
- No DaisyUI CDN page template
- No signal cache / PatchBus as the primary update path
- Compiler preload (`bunfig.toml`) removed

Historical notes may remain under `iterations/`.
