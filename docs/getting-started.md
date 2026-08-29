# Getting started

## Requirements

- [Bun](https://bun.sh/) 1.1+ (runtime for `clay` and app code)
- Node-compatible OS (macOS / Linux / WSL)
- For local tarball installs: npm (links co-installed `file:` packages; Bun may try the registry for rewritten versions)

## Outside the monorepo

Consumers import `@close-by/clay` and run apps with the `clay` binary from `@close-by/clay-cli`. The CLI ships prebuilt Vite assets (`client-dist`); you do **not** need `@close-by/clay-client` or a monorepo `build:client`.

Walkthrough (tasks list → two pages + `--app`): [Sample app](./tutorial.md).

### From local packs (this repo)

```bash
# In the Clay checkout:
bun install
bun run pack:publishable   # build:client + bun pm pack → dist-pack/*.tgz
# workspace:* is rewritten to real versions inside each tarball

# In your app directory:
npm install \
  /path/to/clay/dist-pack/close-by-clay-core-0.1.0.tgz \
  /path/to/clay/dist-pack/close-by-clay-auth-0.1.0.tgz \
  /path/to/clay/dist-pack/close-by-clay-compiler-0.1.0.tgz \
  /path/to/clay/dist-pack/close-by-clay-persistence-file-0.1.0.tgz \
  /path/to/clay/dist-pack/close-by-clay-components-0.1.0.tgz \
  /path/to/clay/dist-pack/close-by-clay-server-0.1.0.tgz \
  /path/to/clay/dist-pack/close-by-clay-0.1.0.tgz \
  /path/to/clay/dist-pack/close-by-clay-cli-0.1.0.tgz
```

Install **all** runtime tarballs together so `@close-by/clay` and `@close-by/clay-*@0.1.0` resolve from the co-installed packs (they are not on the public registry yet).

### When published to npm

```bash
bun add @close-by/clay-cli @close-by/clay
# transitive: core, components, server, persistence-file
# optional: bun add @close-by/clay-auth
```

### Publishing to npm (maintainers)

Runtime packages are scoped (`@close-by/clay` and `@close-by/clay-*`) and public (`publishConfig.access: public`). Publish **in dependency order** so the registry can resolve rewritten versions:

1. `@close-by/clay-core`
2. `@close-by/clay-auth`
3. `@close-by/clay-compiler`
4. `@close-by/clay-persistence-file`
5. `@close-by/clay-components`
6. `@close-by/clay-server`
7. `@close-by/clay`
8. `@close-by/clay-cli`

```bash
# In the Clay checkout:
bun install
npm login                          # once; needs rights on the @close-by org

bun run publish:dry                # pack + validate + npm publish --dry-run (no upload)
bun run publish:npm                # pack + validate + real npm publish (same order)
# Re-run is safe: versions already on npm are skipped.
```

Equivalent manual flow from packed tarballs:

```bash
bun run pack:publishable
npm publish ./dist-pack/close-by-clay-core-0.1.0.tgz --access public
npm publish ./dist-pack/close-by-clay-auth-0.1.0.tgz --access public
npm publish ./dist-pack/close-by-clay-compiler-0.1.0.tgz --access public
npm publish ./dist-pack/close-by-clay-persistence-file-0.1.0.tgz --access public
npm publish ./dist-pack/close-by-clay-components-0.1.0.tgz --access public
npm publish ./dist-pack/close-by-clay-server-0.1.0.tgz --access public
npm publish ./dist-pack/close-by-clay-0.1.0.tgz --access public
npm publish ./dist-pack/close-by-clay-cli-0.1.0.tgz --access public
```

`publish:dry` checks each tarball for rewritten deps (no `workspace:*`), `license` / README / LICENSE, CLI `bin` + `client-dist`, then runs `npm publish --dry-run`. `publish:npm` looks up each `name@version` on the registry and **skips** if it is already published (resume after a partial failure). Use `--skip-pack` to reuse an existing `dist-pack/`: `bun scripts/publish-from-pack.ts --dry-run --skip-pack`.

### Run

```typescript
// hello.ts
import { ui } from '@close-by/clay';

export default function () {
  ui.label('Hello Clay');
  ui.button('Ping', { onClick: () => ui.notify('hi', 'success') });
}
```

```bash
bunx clay hello.ts   # → http://localhost:3000 (opens browser)
```

`ui.run(() => { … })` also works; CLI `-p` / `--title` / `--app` apply when the entry uses a default export or `ui.page` and lets the CLI start the server.

## Three-line app (`clay`) — monorepo

```typescript
// hello.ts
import { ui } from '@close-by/clay';

ui.run(() => {
  ui.label('Hello Clay');
  ui.button('Ping', { onClick: () => ui.notify('hi', 'success') });
});
```

**This monorepo:** build the client once (also copies assets into `@close-by/clay-cli` for packaging), then use the workspace CLI:

```bash
bun install
bun run build:client          # Vite → packages/client/dist (+ copy → packages/cli/client-dist)
bun run clay hello.ts        # → http://localhost:3000 (opens browser)
```

The CLI prefers `packages/cli/client-dist` when present, otherwise falls back to `packages/client/dist` so local `bun run clay` / `demo:cli` work after a single `build:client`.

Or a default export (CLI registers `/` and starts the server for you):

```typescript
import { ui } from '@close-by/clay';

export default function () {
  ui.label('Hello Clay');
}
```

```bash
bun run clay hello.ts --port 4000
```

### Multi-page SPA with shell

```bash
bun run clay ./pages --app --title "My App"
# loadPages + ui.run({ app: { title, nav: navFromPages() } })
```

| Flag | Meaning |
|------|---------|
| `-p, --port` | Port (default `3000`) |
| `-t, --title` | HTML / shell title |
| `--app` | Dashboard shell + nav from discovered pages |
| `--no-open` | Do not open the browser |
| `--reload` | Restart on file changes (`bun --watch`); opens the browser once; prints `↻ clay: reloading…` and re-imports pages (clears `require.cache`) |
| `--reactive-let` | Enable compile-time reactive `let` Bun loader (**off** by default; still needs `// @clay-reactive` or `"use reactive";` in source) |
| `--no-reactive-let` | Disable the reactive-let plugin (default) |

See [`docs/reactive-let.md`](./reactive-let.md) for `ui.state` / `ui.auto` (recommended), `ui.label(() => …)`, and the opt-in Phase 2 `let` transform.

## Install and run the demo

```bash
bun install
bun run build:client   # builds packages/client → dist, copies into @close-by/clay-cli
bun run demo           # starts apps/demo on :4000
# or
bun run demo:cli       # same examples via `clay … --app`
```

Or in one step:

```bash
bun run dev
```

Open:

- http://localhost:4000 — home with links to examples
- http://localhost:4000/examples/counter
- http://localhost:4000/examples/todo
- http://localhost:4000/examples/form-demo
- http://localhost:4000/examples/auth

| Script | What it does |
|--------|----------------|
| `bun run build:client` | Vite production build of the React client + copy into `@close-by/clay-cli` |
| `bun run pack:publishable` | `build:client` + pack `@close-by/clay-core` … `@close-by/clay` … `@close-by/clay-cli` → `dist-pack/` |
| `bun run publish:dry` | Pack + validate tarballs + `npm publish --dry-run` (no registry upload) |
| `bun run publish:npm` | Pack + validate + `npm publish` in order (requires `npm login`) |
| `bun run demo` | Start demo server (`main.ts`; expects client already built) |
| `bun run demo:cli` | Start demo via `clay apps/demo/src/examples --app` (loads `_run.ts` auth config) |
| `bun run clay …` | CLI runtime (`@close-by/clay-cli`) |
| `bun run dev` | Build client, then start demo |
| `bun test` | Run package tests |

### Packaging notes (maintainers)

- Source packages keep `workspace:*` for the monorepo; `bun pm pack` / publish rewrites them to the package version.
- `@close-by/clay-client` is **private**; only its Vite `dist` is copied into `@close-by/clay-cli` (`copy-client` / CLI `prepack`, also invoked by `build:client`).
- Root stays `private: true`. Each runtime package ships `license`, `README.md`, `LICENSE`, and `publishConfig.access: public`.
- Publish order: `core` → `auth` → `compiler` → `persistence-file` → `components` → `server` → `ui` → `cli` (see **Publishing to npm** above).

## Library mode (multi-page entrypoint)

Create a page file and an entrypoint:

```typescript
// pages/counter.ts
import { ui } from '@close-by/clay';

export const pageMeta = { label: 'Counter', icon: 'hash', order: 10 };

ui.page('/counter', () => {
  let count = 0;
  const label = ui.label(`Count: ${count}`).classes('text-2xl');

  ui.row(() => {
    ui.button('-', {
      variant: 'destructive',
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
  }, { gap: 2 });
});
```

```typescript
// main.ts
import { ui } from '@close-by/clay';

await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  port: 4000,
  title: 'My App',
  css: './globals.css', // optional theme overrides
  app: {
    title: 'My App',
    nav: ui.navFromPages(),
  },
});
```

Point `clientDir` with `resolveClayClientDir()` (or omit it — `ui.run` does the same) instead of hardcoding `node_modules/@close-by/clay-cli/client-dist`. Details: [Boot](./boot.md).

Use `css` to inject your own stylesheet after the built client styles. **Token overrides** (`--primary`, `--background`, …) always work. **New Tailwind utilities** only work if you build them with a scanned Tailwind pipeline — see [Tailwind](./tailwind.md). Runtime CSS cannot invent unscanned utilities.

## Project layout (monorepo)

```
apps/demo/           Demo pages + server entry (`loadPages` + `ui.run({ app })`)
packages/cli/         `clay` binary — file/dir launcher + shipped client-dist
packages/ui/         NiceGUI-style ui facade (`loadPages`, `navFromPages`, `run`)
packages/core/       Element tree, session, page wrapper, reactive, storage (tab/user/app)
packages/auth/       Optional password hash, login limiter, requireAuth / requireRole, audit
packages/persistence-file/  File-backed PersistenceAdapter for storage.configure
packages/components/ Element factories (button, input, dataTable, areaChart / barChart / lineChart / pieChart / radarChart / radialChart, …)
packages/client/     React + ShadCN renderer (Sonner toasts, BoundDataTable, …) — private, not published
packages/server/     Bun HTTP + WebSocket
docs/                This documentation
```

## Next

- [Concepts](./concepts.md) — sessions, patches, refreshable
- [API](./api.md) — full `ui.*` reference
- [Examples](./examples.md) — demo catalog
