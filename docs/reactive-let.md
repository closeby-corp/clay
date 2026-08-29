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
   - File pragma: `// @clay-reactive` (near the top of the file)
   - Block directive as the first statement: `"use reactive";`
   - Nested function callbacks **inside** an already-eligible site (e.g. `ui.column(() => { let n = 0; … })` under a pragma/`"use reactive"` parent)

`ui.page(...)` alone does **not** opt in.

### What transforms

Simple `let name = <simple>` declarations **anywhere** in an eligible function body, including nested blocks (`if` / bare blocks / `try` / `switch`), but **not** inside loops or nested function scopes (nested functions are their own sites when eligible):

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

**Simple initializers:** literals; `undefined`; unary `±!~`; binary / conditional / template expressions of simples; property / element access of simples; identifiers (outer bindings); shallow array/object literals. **Not** transformed: `call()` / `new` / `await`, destructuring, sibling-let refs (`let a = 1; let b = a + 1` aborts the site), loop-scoped `let`.

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

- No destructuring (`let { x } = …`), `const`, or `var`.
- No call / `new` / await initializers (leave as plain `let` or use Phase 1).
- Sibling-let initializers abort the site (`let b = a + 1` when both would lift).
- No loop-scoped `let` (would re-init incorrectly if hoisted).
- Duplicate `let` names in nested blocks abort the transform for that function (shadowing).
- Compile-time `bindText` covers `ui.label` / `label` only (not badge/button text props).
- Running the demo via plain `bun apps/demo/...` does **not** load the plugin unless you register it; use `clay --reactive-let` or `--preload`.

Tests: `packages/compiler/src/transform.test.ts`.

## Still Later

1. `const` / destructured / loop-scoped reactive bindings where safe.
2. Nested `auto` reuse without remounting when only inner props change.
3. Optional: bindText-style rewrite for more widgets (`badge` text, etc.).
4. Docs: sell `let` as the tutorial happy path once ops apps adopt the proof page in anger.

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
