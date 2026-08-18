# Compile-time reactive `let`

Status: **Phase 1 shipped** (`ui.state` + `ui.auto`, with in-place props sync when the tree shape is stable). **Phase 2 shipped** (`@close-by/clay-compiler` transform + `clay` CLI Bun loader; expanded beyond the original leading-`let` MVP).

## Goal

NiceGUI-style automatic UI updates when local state changes, without manual `setText` / `refresh` on every write.

## Phase 1 (shipped)

Runtime helpers — no compiler:

```ts
const s = ui.state({ count: 0 });
ui.auto(() => {
  ui.button('Inc', { onClick: () => { s.count++; } });
  ui.label(`Count: ${s.count}`); // patches text when s.count changes (stable tree)
});

// Or bind a single label without wrapping `auto`:
ui.label(() => `Count: ${s.count}`);
```

| API | Behavior |
|-----|----------|
| `ui.state(initial)` | Alias for `reactive()` — proxy that notifies on property writes |
| `ui.auto(fn)` | `RefreshableElement` that tracks `state`/`reactive` **reads** during `fn`, then rebuilds on those writes. When the child tree **shape** (types + counts) is unchanged and contains no nested `refreshable`/`auto`, updates go via `updateProps` (`setText`/`setValue`-style) instead of `setChildren` remount |
| `ui.label(() => string)` | Creates a label and `.bindText(compute)` — re-runs compute when tracked reads change |
| `Element.bindText(fn)` | Same tracking as `auto`, but only patches `text` |
| `reactive` / `subscribe` / `bindValue` / `bindTextFrom` | Unchanged |

**Rules**

- Keep mutable state **outside** `ui.auto` (or it resets each rebuild).
- Only properties **read** during the last builder run are tracked.
- Prefer `ui.label(() => …)` / `bindText` / `bindTextFrom` / `bindValue` when a full block rebuild is unnecessary.
- Structural changes inside `auto` (added/removed children, type changes, nested `auto`) still remount via `setChildren`.

Tests: `packages/core/src/auto.test.ts`, `packages/core/src/element.test.ts`.

## Phase 2 (shipped)

Package `@close-by/clay-compiler` rewrites a **documented subset** of `let` into Phase 1 APIs.

### Opt-in

Any of:

1. File pragma: `// @clay-reactive` (near the top of the file)
2. Block directive as the first statement: `"use reactive";`
3. Leading / body `let`s inside a `page(...)` / `ui.page(...)` callback (no pragma required)
4. Nested function callbacks **inside** an already-eligible site (e.g. `ui.column(() => { let n = 0; … })` under `ui.page`)

### What transforms

Simple `let name = <simple>` declarations **anywhere** in an eligible function body, including nested blocks (`if` / bare blocks / `try` / `switch`), but **not** inside loops or nested function scopes (nested functions are their own sites when eligible):

```ts
import { ui } from '@close-by/clay';

ui.page('/', () => {
  ui.label('hi');
  let count = 0;
  ui.label(`Count: ${count}`);
  ui.button('+', { onClick: () => { count++; } });
});
```

Becomes roughly:

```ts
ui.page('/', () => {
  const __clay_s0 = ui.state({ count: 0 });
  ui.auto(() => {
    ui.label('hi');
    ui.label(`Count: ${__clay_s0.count}`);
    ui.button('+', { onClick: () => { __clay_s0.count++; } });
  });
});
```

**Simple initializers:** number / string / boolean / null / `undefined` literals, bigint literals, unary `±number`, parenthesized / `as` / `satisfies` wrappers of the same, and shallow array/object literals of the same.

### CLI

The `clay` CLI registers the Bun loader plugin by default (before importing the entry). Disable with `--no-reactive-let`.

```bash
clay ./pages --app --reload
clay hello.ts --no-reactive-let
```

Programmatic:

```ts
import { registerReactiveLetPlugin } from '@close-by/clay-compiler/plugin';
import { transformReactiveLet } from '@close-by/clay-compiler';

registerReactiveLetPlugin();
```

### Limits (still open)

- No destructuring (`let { x } = …`), `const`, or `var`.
- No deep / computed initializers (function calls, `new`, awaited values, binary expressions).
- No loop-scoped `let` (would re-init incorrectly if hoisted).
- Duplicate `let` names in nested blocks abort the transform for that function (shadowing).
- Does not rewrite interpolations into `bindText` at compile time (runtime `auto` already prefers props patches when the tree is stable).
- Running the demo via plain `bun apps/demo/...` does **not** load the plugin unless you register it; use `clay` or `--preload`.

Tests: `packages/compiler/src/transform.test.ts`.

## Still Later

1. Broader NiceGUI parity (compile-time `bindText` rewrite, finer dependency tracking without rebuilding the auto builder at all).
2. Loop-scoped / destructured / `const` reactive bindings.
3. Nested `auto` reuse without remounting when only inner props change.
