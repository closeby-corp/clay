# BadUI

Server-driven UI for TypeScript, inspired by [NiceGUI](https://nicegui.io/). You write imperative `ui.*` on the server; a thin React + ShadCN client renders the element tree over WebSocket.

## Features

- **NiceGUI-like API** — `ui.page`, `ui.run`, `ui.button`, `ui.label`, `ui.row`, `ui.refreshable`, `bindValue`, `bindTextFrom`, `setText`, `onClick`
- **Server-owned element tree** — per-client session; updates are WS patches, not full-page morphs
- **React + ShadCN client** — Radix/Tailwind components under the hood (PascalCase internals only)
- **Bun monorepo** — TypeScript end-to-end

## Quick Start

```bash
bun install
bun run build:client   # Vite build → packages/client/dist
bun run demo           # or: bun run dev  (builds client then starts)

open http://localhost:4000/examples/counter
```

## Authoring example

```typescript
import { ui } from '@badui/ui';

ui.page('/examples/counter', () => {
  let count = 0;
  const label = ui.label(`Count: ${count}`);

  ui.row(() => {
    ui.button('-', {
      onClick: () => {
        count--;
        label.setText(`Count: ${count}`);
      },
    });
    ui.button('+', {
      onClick: () => {
        count++;
        label.setText(`Count: ${count}`);
      },
    });
  });
});

ui.run({ port: 4000, title: 'BadUI Demo' });
```

Todo-style patterns use `bindValue` and `ui.refreshable(...).refresh()` for structural updates.

## Architecture

```
App (ui.page / ui.refreshable)
  → Server element tree (per WebSocket session)
  → WS ops: hello / mount / patch / event
  → React client shell → ShadCN components
```

| Package | Role |
|---------|------|
| `@badui/core` | Element tree, session, bindings, refreshable, WS protocol types |
| `@badui/ui` | NiceGUI-style `ui` facade (`page`, `run`, `button`, `row`, …) |
| `@badui/components` | Thin factories that create element nodes |
| `@badui/client` | React app: WS hook + element → ShadCN renderer |
| `@badui/server` | Bun HTTP for static client + WebSocket upgrade |

## WebSocket protocol (camelCase)

- **Client → server:** `{ op: "hello", path }` then `{ op: "event", id, type, value? }`
- **Server → client:** `{ op: "mount", sessionId, tree }` and `{ op: "patch", patches }`
- **Element JSON:** `{ id, type, props, children }` — handlers stay on the server; client gets `props.events`

## Retired

The previous Datastar + DaisyUI + SSE signal-sync path is removed from the demo runtime:

- No Datastar SDK, `/badui/stream`, or `/badui/events`
- No DaisyUI CDN template
- `@badui/compiler` (reactive `let` → Datastar signals) is no longer loaded (`bunfig.toml` preload removed)

Historical experiments may still live under `iterations/`.

## Gaps vs full NiceGUI

Not in this first cut: timers/JS bridge, horizontal scaling, advanced DataTable (selection/edit/group), every NiceGUI control, or compile-time reactive `let`. Core model + Counter/Todo/Chat/Form demos are the target.
