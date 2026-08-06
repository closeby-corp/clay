# Getting started

## Requirements

- [Bun](https://bun.sh/) 1.1+ (runtime for `badui` and app code)
- Node-compatible OS (macOS / Linux / WSL)
- For local tarball installs: npm (links co-installed `file:` packages; Bun may try the registry for rewritten versions)

## Outside the monorepo

Consumers import `@badui/ui` and run apps with the `badui` binary from `@badui/cli`. The CLI ships prebuilt Vite assets (`client-dist`); you do **not** need `@badui/client` or a monorepo `build:client`.

### From local packs (this repo)

```bash
# In the BadUI checkout:
bun install
bun run pack:publishable   # build:client + bun pm pack → dist-pack/*.tgz
# workspace:* is rewritten to real versions inside each tarball

# In your app directory:
npm install \
  /path/to/bad-ui/dist-pack/badui-core-0.1.0.tgz \
  /path/to/bad-ui/dist-pack/badui-persistence-file-0.1.0.tgz \
  /path/to/bad-ui/dist-pack/badui-components-0.1.0.tgz \
  /path/to/bad-ui/dist-pack/badui-server-0.1.0.tgz \
  /path/to/bad-ui/dist-pack/badui-ui-0.1.0.tgz \
  /path/to/bad-ui/dist-pack/badui-cli-0.1.0.tgz
```

Install **all** runtime tarballs together so `@badui/*@0.1.0` resolves from the co-installed packs (they are not on the public registry yet).

### When published to npm

```bash
bun add @badui/cli @badui/ui
# transitive: core, components, server, persistence-file
```

### Publishing to npm (maintainers)

Runtime packages are scoped (`@badui/*`) and public (`publishConfig.access: public`). Publish **in dependency order** so the registry can resolve rewritten versions:

1. `@badui/core`
2. `@badui/persistence-file`
3. `@badui/components`
4. `@badui/server`
5. `@badui/ui`
6. `@badui/cli`

```bash
# In the BadUI checkout:
bun install
npm login                          # once; needs rights on the @badui scope

bun run publish:dry                # pack + validate + npm publish --dry-run (no upload)
bun run publish:npm                # pack + validate + real npm publish (same order)
```

Equivalent manual flow from packed tarballs:

```bash
bun run pack:publishable
npm publish ./dist-pack/badui-core-0.1.0.tgz --access public
npm publish ./dist-pack/badui-persistence-file-0.1.0.tgz --access public
npm publish ./dist-pack/badui-components-0.1.0.tgz --access public
npm publish ./dist-pack/badui-server-0.1.0.tgz --access public
npm publish ./dist-pack/badui-ui-0.1.0.tgz --access public
npm publish ./dist-pack/badui-cli-0.1.0.tgz --access public
```

`publish:dry` checks each tarball for rewritten deps (no `workspace:*`), `license` / README / LICENSE, CLI `bin` + `client-dist`, then runs `npm publish --dry-run`. Use `--skip-pack` to reuse an existing `dist-pack/`: `bun scripts/publish-from-pack.ts --dry-run --skip-pack`.

### Run

```typescript
// hello.ts
import { ui } from '@badui/ui';

export default function () {
  ui.label('Hello BadUI');
  ui.button('Ping', { onClick: () => ui.notify('hi', 'success') });
}
```

```bash
bunx badui hello.ts   # → http://localhost:3000 (opens browser)
```

`ui.run(() => { … })` also works; CLI `-p` / `--title` / `--app` apply when the entry uses a default export or `ui.page` and lets the CLI start the server.

## Three-line app (`badui`) — monorepo

```typescript
// hello.ts
import { ui } from '@badui/ui';

ui.run(() => {
  ui.label('Hello BadUI');
  ui.button('Ping', { onClick: () => ui.notify('hi', 'success') });
});
```

**This monorepo:** build the client once (also copies assets into `@badui/cli` for packaging), then use the workspace CLI:

```bash
bun install
bun run build:client          # Vite → packages/client/dist (+ copy → packages/cli/client-dist)
bun run badui hello.ts        # → http://localhost:3000 (opens browser)
```

The CLI prefers `packages/cli/client-dist` when present, otherwise falls back to `packages/client/dist` so local `bun run badui` / `demo:cli` work after a single `build:client`.

Or a default export (CLI registers `/` and starts the server for you):

```typescript
import { ui } from '@badui/ui';

export default function () {
  ui.label('Hello BadUI');
}
```

```bash
bun run badui hello.ts --port 4000
```

### Multi-page SPA with shell

```bash
bun run badui ./pages --app --title "My App"
# loadPages + ui.run({ app: { title, nav: navFromPages() } })
```

| Flag | Meaning |
|------|---------|
| `-p, --port` | Port (default `3000`) |
| `-t, --title` | HTML / shell title |
| `--app` | Dashboard shell + nav from discovered pages |
| `--no-open` | Do not open the browser |
| `--reload` | Restart on file changes (`bun --watch`) |
| `--reactive-let` | Enable compile-time reactive `let` Bun loader (default) |
| `--no-reactive-let` | Disable the reactive-let plugin |

See [`docs/reactive-let.md`](./reactive-let.md) for `ui.state` / `ui.auto`, `ui.label(() => …)`, and the Phase 2 `let` transform.

## Install and run the demo

```bash
bun install
bun run build:client   # builds packages/client → dist, copies into @badui/cli
bun run demo           # starts apps/demo on :4000
# or
bun run demo:cli       # same examples via `badui … --app`
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

| Script | What it does |
|--------|----------------|
| `bun run build:client` | Vite production build of the React client + copy into `@badui/cli` |
| `bun run pack:publishable` | `build:client` + pack `@badui/{core,persistence-file,components,server,ui,cli}` → `dist-pack/` |
| `bun run publish:dry` | Pack + validate tarballs + `npm publish --dry-run` (no registry upload) |
| `bun run publish:npm` | Pack + validate + `npm publish` in order (requires `npm login`) |
| `bun run demo` | Start demo server (`main.ts`; expects client already built) |
| `bun run demo:cli` | Start demo via `badui apps/demo/src/examples --app` |
| `bun run badui …` | CLI runtime (`@badui/cli`) |
| `bun run dev` | Build client, then start demo |
| `bun test` | Run package tests |

### Packaging notes (maintainers)

- Source packages keep `workspace:*` for the monorepo; `bun pm pack` / publish rewrites them to the package version.
- `@badui/client` is **private**; only its Vite `dist` is copied into `@badui/cli` (`copy-client` / CLI `prepack`, also invoked by `build:client`).
- Root stays `private: true`. Each runtime package ships `license`, `README.md`, `LICENSE`, and `publishConfig.access: public`.
- Publish order: `core` → `persistence-file` → `components` → `server` → `ui` → `cli` (see **Publishing to npm** above).

## Library mode (multi-page entrypoint)

Create a page file and an entrypoint:

```typescript
// pages/counter.ts
import { ui } from '@badui/ui';

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
import { ui } from '@badui/ui';

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

Point `clientDir` at a built `@badui/client` dist only if the default (`packages/client/dist`) is wrong for your layout. The `badui` CLI serves shipped assets from `packages/cli/client-dist` (or the monorepo `packages/client/dist` fallback).

Use `css` to inject your own `globals.css` after the built client styles — override shadcn-style tokens such as `--primary`, `--background`, and `--sidebar` (and optional `.dark`) without rebuilding the client. Runtime CSS cannot add new Tailwind utilities; use those variables or plain CSS.

## Project layout (monorepo)

```
apps/demo/           Demo pages + server entry (`loadPages` + `ui.run({ app })`)
packages/cli/         `badui` binary — file/dir launcher + shipped client-dist
packages/ui/         NiceGUI-style ui facade (`loadPages`, `navFromPages`, `run`)
packages/core/       Element tree, session, page wrapper, reactive, storage (tab/user/app)
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
