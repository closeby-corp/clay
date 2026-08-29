# Compile-time reactive `let`

Status: **Phase 1 shipped** (`ui.state` + `ui.auto`, with in-place props sync when the tree shape is stable). **Phase 2 shipped** (`@close-by/clay-compiler` transform + optional `clay --reactive-let` Bun loader; implicit regions, dep-isolated `auto`, compile-time `bindText` for labels).

**Default:** Prefer Phase 1 (`ui.state` / `ui.auto`) for real apps. The Phase 2 `let` rewrite is **opt-in** (CLI plugin off unless `--reactive-let`; transform only with a pragma or `"use reactive";`). Silent page-wide rewrites caused blank mounts and CJS interop pain in production hubs — see [Known failure modes](#known-failure-modes).

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

## Phase 2 (shipped, opt-in)

Package `@close-by/clay-compiler` rewrites a **documented subset** of `let` into Phase 1 APIs.

### Opt-in (required)

Both of:

1. **CLI / loader:** pass `--reactive-let` to `clay` (or call `registerReactiveLetPlugin()` yourself). Off by default.
2. **Source:** one of:
   - File pragma: `// @clay-reactive` (near the top of the file) — applies to **module-level** functions and callbacks that are **not** nested inside another function (e.g. `ui.page('/', () => { … })`)
   - Block directive as the first statement: `"use reactive";` — required for nested helpers / `ui.column(() => …)` lets

`ui.page(...)` alone does **not** opt in. Nested `function` / arrow bodies do **not** inherit the file pragma (avoids lifting scratch `let`s in helpers into separate state islands).

### Who wraps `ui.auto`?

Compile-time region analysis **does not** see into nested function bodies. Authors must still wrap rebuild regions when UI is built from helpers or widget callbacks:

| Pattern | Who wraps `ui.auto`? |
|---------|----------------------|
| Inline UI in the reactive site body that reads lets | Transform (or `bindText` on labels) |
| Named `renderX()` builders | **Author** — `ui.auto(() => { renderFeed(); })` |
| UI inside widget callbacks (`row` / `column` / `dialog` / …) that need rebuild | **Author**, **or** read lets at the site top level so the transform can see them |

Bare top-level `renderFeed()` calls that read lifted lets are **auto-wrapped** in `ui.auto(() => { renderFeed(); })` by default (`autoWrapBuilders: true`). Pass `{ autoWrapBuilders: false }` to the transform to only **warn** instead.

### What transforms

Simple `let` / `const` declarations (identifier or **simple** object/array destructuring) with a simple initializer **anywhere** in an eligible function body, including nested blocks (`if` / bare blocks / `try` / `switch`), but **not** inside loops or nested function scopes (nested functions are separate sites only with their own `"use reactive";`):

```ts
// @clay-reactive
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
  ui.label('hi'); // inert — no build-time read of count
  ui.label(() => `Count: ${__clay_s0.count}`); // compile-time bindText
  ui.button('+', { onClick: () => { __clay_s0.count++; } }); // handler-only write
});
```

**Implicit regions**

| Pattern | Result |
|---------|--------|
| `ui.label(expr)` that reads tracked state | `ui.label(() => expr)` — runtime `bindText`, no `auto` |
| Other build-time reads (e.g. `ui.badge({ text: String(n) })`) | `ui.auto` around that statement |
| Contiguous autos with **disjoint** deps | Separate `auto` regions |
| Contiguous autos with **overlapping** deps | One shared `auto` |
| Shell / layout / handler-only writes | Stay outside any `auto` |
| Nested `ui.column(() => …)` reading outer state | Inner region / bindText inside the callback |

**Simple initializers:** literals; `undefined`; unary `±!~`; binary / conditional / template expressions of simples; property / element access of simples; identifiers (outer bindings); shallow array/object literals; **call / `new`** with simple callees and args (`Date.now()`, `defaultRangeFrom()`, `new Map()`); nullish coalescing (`??`) for destructuring defaults. **Not** transformed: `await`, rest/spread/nested destructuring, sibling-let refs (`let a = 1; let b = a + 1` aborts the site), loop-scoped `let`, spread args.

Type positions are never rewritten — a lifted `let loading` may share a name with `type DetailState { loading: boolean }` without breaking emit.

### CLI

```bash
clay ./pages --app --reload                 # no reactive-let plugin
clay hello.ts --reactive-let                # enable Bun loader; still need pragma / "use reactive"
clay hello.ts --no-reactive-let             # explicit off (same as default)
```

Programmatic:

```ts
import { registerReactiveLetPlugin } from '@close-by/clay-compiler/plugin';
import { transformReactiveLet } from '@close-by/clay-compiler';

registerReactiveLetPlugin();
```

### Known failure modes

When the transform or Bun loader was on by default (pre–opt-in), dense apps hit:

| Symptom | Likely cause |
|---------|----------------|
| Blank UI / mount errors | Simple `let`s inside `ui.page` rewritten into a mega-`auto` that fights async load / structural patterns |
| `@clickhouse/client` (and similar CJS) named-export breakage | Bun `onLoad` plugin in the path; prefer `--no-reactive-let` (default) or Clay’s HTTP helpers until interop is proven |

Mitigation today: leave the plugin off; use Phase 1 APIs. If you enable `--reactive-let`, only mark intentional toy/demo files with the pragma.

### Limits (still open)

- No rest / nested destructuring (`let { x, ...r }`, `let { a: { b } }`) or `var`. Simple defaults in object/array patterns are supported (`let { x = 1 }`, `let [y = 10] = []`).
- Sibling initializers abort the site (`let b = a + 1` when both would lift).
- No loop-scoped bindings (would re-init incorrectly if hoisted).
- Duplicate binding names in nested blocks abort the transform for that function (shadowing). A **warning** is emitted when a non-lifted local reuses a lifted name in the same site.
- Compile-time `bindText` covers `ui.label` / `label` only (not badge/button text props).
- Running the demo via plain `bun apps/demo/...` does **not** load the plugin unless you register it; use `clay --reactive-let` or `--preload`.
- `const` is lifted like `let` (assignments become state writes). Prefer `let` in typed source if you reassign — `const` reassignment is a TS error before the transform runs.

Tests: `packages/compiler/src/transform.test.ts`.

## Still Later

1. Loop-scoped reactive bindings where safe; rest/nested destructuring.
2. Optional: bindText-style rewrite for more widgets (`badge` text, etc.).
3. Docs: sell `let` as the tutorial happy path once ops apps adopt the proof page in anger.
4. P2: emit renames for shadowing (warnings exist today).

**Runtime:** nested `auto` / `refreshable` trees reuse in place when structure matches (`canReuseElementTree` in `@close-by/clay-core`) — inner regions keep their ids when an outer `auto` refreshes without touching inner deps.

## Proof (Orders-shaped)

| Page | Syntax | Run |
|------|--------|-----|
| [`ReactiveLetOrders.ts`](../apps/demo/src/examples/ReactiveLetOrders.ts) | Phase 1 `state` / `auto` | `bun run cli` |
| [`ReactiveLetOrdersLet.ts`](../apps/demo/src/examples/ReactiveLetOrdersLet.ts) | `let` + `// @clay-reactive` | `bun run cli:reactive-let` |

```bash
cd apps/demo && bun run cli                 # Orders (state/auto) — always interactive
cd apps/demo && bun run cli:reactive-let    # both pages; let page needs this
```

Compiler coverage: `packages/compiler/src/orders-proof.test.ts` transforms the let demo and asserts separate list/detail regions (no mega-`auto`).

Without `--reactive-let`, `let` assignments are silent no-ops (no error).
