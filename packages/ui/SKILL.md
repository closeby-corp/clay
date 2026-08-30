---
name: clay
description: >-
  Build Clay server-driven UI apps with ui.* on Bun. Use when authoring Clay
  pages, demos, or ops consoles; importing @close-by/clay; running clay CLI;
  ui.page/ui.run/ui.state/ui.auto; or when the user asks about Clay, NiceGUI-style
  TypeScript UI, or server-owned element trees.
---

# Clay

Server-driven UI for TypeScript. Write imperative `ui.*` on the server; Clay owns a per-tab element tree and syncs it to a React + ShadCN client over WebSocket.

**Clay is not React.** Do not write React components, JSX, or client-side screen logic for app pages. The React client is a renderer only.

## Install and run

```bash
bun add @close-by/clay-cli @close-by/clay
```

```typescript
// hello.ts
import { ui } from '@close-by/clay';

export default function () {
  ui.label('Hello Clay');
  ui.button('Ping', { onClick: () => ui.notify('hi', 'success') });
}
```

```bash
bunx clay hello.ts   # http://localhost:3000
```

**Monorepo (this repo):** `bun run build:client` before `bun run demo` or `bun run clay …` — new wire types require a rebuilt client bundle.

## Mental model

1. `ui.page(path, fn)` or `ui.run(fn)` builds an **element tree** on the server.
2. Each browser tab = one **WebSocket session**; page code runs once per tab.
3. User events → server handlers → **patches** (`updateProps`, `setChildren`) → client re-render.
4. Local `let` / session state is **per tab**, not shared. Use `ui.storage.app` for process-wide data.

## Reactive UI (preferred)

Keep mutable state **outside** rebuild blocks:

```typescript
const s = ui.state({ count: 0, items: [] as string[] });

ui.auto(() => {
  ui.label(`Count: ${s.count}`);
  ui.button('+', { onClick: () => { s.count++; } });
  for (const item of s.items) ui.label(item);
});

// Or bind one label without a full block:
ui.label(() => `Count: ${s.count}`);
```

| API | Use when |
|-----|----------|
| `ui.state(initial)` | Reactive object; writes trigger tracked rebuilds |
| `ui.auto(fn)` | Rebuild a UI block when tracked state changes |
| `ui.label(() => …)` / `bindText` | Patch text only (stable tree) |
| `bindValue` | Two-way inputs |
| `ui.refreshable` + `.refresh()` | Simple one-shot structural rebuilds |
| `ui.timer(ms, fn)` | Poll / clock ticks inside reactive pages |

**Inside `ui.auto`:** child tree shape (types + counts) should stay stable when possible — then updates use `updateProps` instead of remounting. For toggling optional `className`, use `undefined` to clear (Clay sends `null` patches).

**Button groups:** use `variant: 'outline'` on all segmented buttons; highlight selection with `className: active ? 'bg-accent' : undefined`.

## Pages and layout

```typescript
ui.page('/dashboard', () => {
  ui.column({ gap: 4 }, () => {
    ui.row({ gap: 2 }, () => {
      ui.button('Save', { onClick: save });
    });
    ui.card({ title: 'Stats' }, () => {
      ui.label('…');
    });
  });
});
```

- Nest with callbacks: `ui.row(() => { … })`, `ui.column(() => { … })`.
- Tailwind: `ui.label('x').classes('text-sm text-muted-foreground')` or pass `className` in props.
- Toasts: `ui.notify('Saved', 'success')`.

## Do not

- Import React, write JSX, or add client components for screens.
- Use `window`, `document`, `navigator` in page code — use `ui.clipboard`, `ui.setUrlHash`, `ui.openExternal`.
- Assume `let` is shared across tabs or users.
- Use `ui.ai.*` as an LLM runtime — it is visual primitives only.

## Docs (shipped with package)

After install, read version-matched docs at `node_modules/@close-by/clay/docs/`:

| Doc | Purpose |
|-----|---------|
| `getting-started.md` | CLI, first app, publish |
| `concepts.md` | Sessions, patches, storage |
| `api.md` | Full `ui.*` reference |
| `elements.md` | Wire types → client mapping |
| `reactive-let.md` | `ui.state` / `ui.auto` / compile-time `let` |
| `ops-patterns.md` | Dense consoles, feeds, tables |
| `examples.md` | Demo route catalog |

Resolve docs programmatically: `resolveClayDocsDir()` from `@close-by/clay/docs-dir`.

## Optional compile-time reactive `let`

Opt-in via `// @clay-reactive` + `clay app.ts --reactive-let`. Prefer explicit `ui.state` + `ui.auto` for production/async-heavy apps.

## Package map (monorepo)

| npm | Role |
|-----|------|
| `@close-by/clay` | `ui.*` facade (this skill ships here) |
| `@close-by/clay-cli` | `clay` binary + bundled client |
| `@close-by/clay-core` | Element tree, sessions, patches |
| `@close-by/clay-components` | Wire element factories |
| `@close-by/clay-server` | HTTP + WebSocket server |

## Agent checklist

1. Read `api.md` / `elements.md` before adding unfamiliar wire types.
2. Use `ui.state` + `ui.auto` for live data; avoid manual `setText` loops.
3. Rebuild client in monorepo after new element types (`bun run build:client`).
4. Match existing demo patterns under `apps/demo/src/examples/` when unsure.
5. Run `bun test` in touched packages; keep diffs minimal.
