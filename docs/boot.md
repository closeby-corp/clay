# Boot: CLI vs library

Clay has two entry styles. Prefer **one production path** (library mode) and treat the CLI as a thin dev wrapper so port, CSS, and `clientDir` do not drift.

## Recommended production path — library mode

```typescript
// index.ts
import { ui, resolveClayClientDir } from '@close-by/clay';
import { join } from 'path';

await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  port: Number(process.env.PORT) || 3000,
  title: 'My App',
  clientDir: resolveClayClientDir(),
  css: join(import.meta.dir, 'src/globals.generated.css'),
  app: {
    title: 'My App',
    nav: ui.navFromPages(),
  },
});
```

```bash
bun ./index.ts
# Docker / ship: CMD ["bun", "./index.ts"]
```

### `clientDir`

| Approach | Notes |
|----------|--------|
| **Omit `clientDir`** | `ui.run` defaults via `resolveClayClientDir()` — prefers `@close-by/clay-cli/client-dist` when that package is installed |
| **`resolveClayClientDir()`** | Explicit; same resolution — use this instead of `join(..., 'node_modules/@close-by/clay-cli/client-dist')` |
| **Custom path** | Only if you ship your own built client |

`resolveClayClientDir` is exported from `@close-by/clay`. The CLI also exposes `resolveBundledClientDir` from `@close-by/clay-cli/helpers` for advanced tooling.

## Dev path — `clay` CLI

```bash
bunx clay ./pages --app --title "My App" --reload
```

Optional `pages/_run.ts` merges into the same `RunConfig` the CLI would pass to `ui.run`:

```typescript
import type { RunConfig } from '@close-by/clay';
import { resolve } from 'path';

export function configureRun(base: RunConfig): RunConfig {
  return {
    ...base,
    port: 4200,
    css: resolve(import.meta.dir, '../src/globals.generated.css'),
    // clientDir already set by the CLI to shipped client-dist
  };
}
```

Keep `_run.ts` as the single place for port/CSS/auth so CLI and library mode stay aligned — library `index.ts` should mirror those values (or import a shared `createRunConfig()` helper).

### Reload stubs

`--reload` writes stubs under **`.clay-reload/`** in the project cwd (not inside `pages/`). Add to `.gitignore`:

```
.clay-reload
```

## Reactive-let

The CLI leaves the compile-time `let` transform **off** unless you pass `--reactive-let`. Library mode never registers the Bun loader unless you call `registerReactiveLetPlugin()` yourself. Prefer Phase 1 `ui.state` / `ui.auto` for real apps — see [reactive-let](./reactive-let.md).

## Checklist (avoid drift)

| Setting | CLI | Library |
|---------|-----|---------|
| Port | `-p` / `_run.ts` | `ui.run({ port })` |
| CSS | `_run.ts` → `css` | `ui.run({ css })` |
| Client assets | CLI sets `clientDir` | `resolveClayClientDir()` or omit |
| Reactive-let | off by default | off unless you register the plugin |
| Nav / shell | `--app` | `app: { nav: ui.navFromPages() }` |
