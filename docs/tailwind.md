# Tailwind CSS for Clay apps

Clay’s shipped client already includes a Tailwind + shadcn token baseline. App-level CSS is for:

1. **Token overrides** (`--primary`, `--background`, …) — always works via `ui.run({ css })`
2. **Extra utilities** used in `className` / `.classes(...)` (e.g. `text-[10px]`, `w-[32rem]`, custom `@keyframes`) — only if those classes are **scanned and built** into a CSS file you inject

Runtime CSS **cannot invent** Tailwind utilities that were never generated. If a class is missing from the built stylesheet, it will not appear in the browser.

## Recommended setup (Tailwind v4 CLI)

```bash
bun add -d tailwindcss @tailwindcss/cli
```

`src/globals.css`:

```css
@import "tailwindcss";

/* Scan Clay page modules (and any helpers that use className strings) */
@source "../pages";
@source ".";

/* Optional: override Clay / shadcn tokens after the import */
:root {
  --primary: oklch(0.45 0.12 150);
}
```

`package.json`:

```json
{
  "scripts": {
    "css:build": "bunx @tailwindcss/cli -i ./src/globals.css -o ./src/globals.generated.css",
    "css:watch": "bunx @tailwindcss/cli -i ./src/globals.css -o ./src/globals.generated.css --watch",
    "dev": "bun run css:build && bunx concurrently \"bun run css:watch\" \"bunx clay ./pages --app --reload\"",
    "start": "bun run css:build && bun ./index.ts"
  }
}
```

Gitignore the generated file (or commit it for simpler deploys):

```
src/globals.generated.css
```

Wire into Clay:

**CLI + `_run.ts`** (dev):

```typescript
// pages/_run.ts
import type { RunConfig } from '@close-by/clay';
import { resolve } from 'path';

export function configureRun(base: RunConfig): RunConfig {
  return {
    ...base,
    css: resolve(import.meta.dir, '../src/globals.generated.css'),
  };
}
```

**Library mode** (prod — recommended single path):

```typescript
// index.ts
import { ui, resolveClayClientDir } from '@close-by/clay';
import { join } from 'path';

await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  port: 4200,
  title: 'My App',
  clientDir: resolveClayClientDir(), // do not hardcode node_modules paths
  css: join(import.meta.dir, 'src/globals.generated.css'),
  app: { title: 'My App', nav: ui.navFromPages() },
});
```

See also [Boot: CLI vs library](./boot.md).

## Minimal example

A copy-paste starter lives at [`examples/tailwind-app/`](../examples/tailwind-app/).

## Token-only (no Tailwind CLI)

If you only need theme colors, skip the CLI and inject a small CSS file of `:root` / `.dark` variables — same as the [demo `globals.css`](../apps/demo/src/globals.css). Arbitrary utilities like `text-[10px]` will **not** work until you add a scanned Tailwind build.
