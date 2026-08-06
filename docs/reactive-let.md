# Compile-time reactive `let`

Status: **Phase 1 shipped** (`ui.state` + `ui.auto`). **Phase 2 MVP shipped** (`@badui/compiler` transform + `badui` CLI Bun loader).

## Goal

NiceGUI-style automatic UI updates when local state changes, without manual `setText` / `refresh` on every write.

## Phase 1 (shipped)

Runtime helpers — no compiler:

```ts
const s = ui.state({ count: 0 });
ui.auto(() => {
  ui.button('Inc', { onClick: () => { s.count++; } });
  ui.label(`Count: ${s.count}`); // rebuilds when s.count changes
});
```

| API | Behavior |
|-----|----------|
| `ui.state(initial)` | Alias for `reactive()` — proxy that notifies on property writes |
| `ui.auto(fn)` | `RefreshableElement` that tracks `state`/`reactive` **reads** during `fn`, then rebuilds on those writes |
| `reactive` / `subscribe` / `bindValue` / `bindTextFrom` | Unchanged |

**Rules**

- Keep mutable state **outside** `ui.auto` (or it resets each rebuild).
- Only properties **read** during the last builder run are tracked.
- Prefer `bindTextFrom` / `bindValue` when a full rebuild is heavier than a props patch.

Tests: `packages/core/src/auto.test.ts`.

## Phase 2 MVP (shipped)

Package `@badui/compiler` rewrites a **documented subset** of `let` into Phase 1 APIs.

### Opt-in

Any of:

1. File pragma: `// @badui-reactive` (near the top of the file)
2. Block directive as the first statement: `"use reactive";`
3. Leading `let`s inside a `page(...)` / `ui.page(...)` callback (no pragma required)

### What transforms

Only **consecutive leading** `let name = <simple>` declarations at the start of a function block (after an optional `"use reactive";`):

```ts
import { ui } from '@badui/ui';

ui.page('/', () => {
  let count = 0;
  ui.label(`Count: ${count}`);
  ui.button('+', { onClick: () => { count++; } });
});
```

Becomes roughly:

```ts
ui.page('/', () => {
  const __badui_s0 = ui.state({ count: 0 });
  ui.auto(() => {
    ui.label(`Count: ${__badui_s0.count}`);
    ui.button('+', { onClick: () => { __badui_s0.count++; } });
  });
});
```

**Simple initializers:** number / string / boolean / null literals, unary `±number`, and shallow array/object literals of the same.

### CLI

The `badui` CLI registers the Bun loader plugin by default (before importing the entry). Disable with `--no-reactive-let`.

```bash
badui ./pages --app --reload
badui hello.ts --no-reactive-let
```

Programmatic:

```ts
import { registerReactiveLetPlugin } from '@badui/compiler/plugin';
import { transformReactiveLet } from '@badui/compiler';

registerReactiveLetPlugin();
```

### Limits (deferred)

- No transform for `let` after other statements, in loops, or nested blocks.
- No destructuring (`let { x } = …`), `const`, or `var`.
- No deep / computed initializers (function calls, `new`, awaited values).
- Does not refine updates to `setText` without remounting the `auto` block.
- Running the demo via plain `bun apps/demo/...` does **not** load the plugin unless you register it; use `badui` or `--preload`.

Tests: `packages/compiler/src/transform.test.ts`.

## Still Later

1. Broader NiceGUI parity (nested scopes, finer dependency tracking without full `auto` remount).
2. **Finer updates** — track interpolations into `setText` without remounting the whole auto block.
3. **`ui.label(() => …)`** sugar that binds without wrapping `auto`.
