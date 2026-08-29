# Compile-time reactive `let`

Status: **Phase 1 shipped** (`ui.state` + `ui.auto`). **Phase 2 shipped** (`@close-by/clay-compiler` transform + optional `clay --reactive-let`; implicit regions, dep-isolated `auto`, compile-time `bindText` for labels, rest/nested destructuring, loop-scoped keyed state, shadow renames).

**Recommended for new demos and toy pages:** write plain `let` with `// @clay-reactive` and `clay --reactive-let` — see [Happy path](#happy-path-let--clay-reactive) below.

**Production / dense apps:** Prefer Phase 1 (`ui.state` / `ui.auto`) when you need explicit control, async load patterns, or want zero compiler surface. Phase 2 remains **opt-in** (CLI plugin off unless `--reactive-let`; transform only with a pragma or `"use reactive";`). Silent page-wide rewrites caused blank mounts and CJS interop pain in production hubs — see [Known failure modes](#known-failure-modes).

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

## Happy path: `let` + `@clay-reactive`

For counter-style pages and demos, you can skip manual `ui.auto` / `label.setText`:

```ts
// counter-let.ts — run: clay counter-let.ts --reactive-let
// @clay-reactive
import { ui } from '@close-by/clay';

export default function () {
  let count = 0;
  ui.label(`Count: ${count}`);
  ui.row({ gap: 2 }, () => {
    ui.button('-', { onClick: () => { count--; } });
    ui.button('+', { onClick: () => { count++; } });
  });
}
```

Clay lifts `count` into `ui.state`, turns the label into `bindText`, and leaves buttons as handler-only writes. No `refresh()` calls.

| When to use `let` + pragma | When to stay on Phase 1 |
|-----------------------------|-------------------------|
| Counters, toggles, filters on demo pages | Async fetch before first paint, heavy CJS imports |
| Orders-shaped proof pages (`ReactiveLetOrdersLet.ts`) | Per-row mutable state without stable row keys |
| Teaching / prototyping NiceGUI-style UX | You want zero Bun loader / compiler in the path |

Phase 1 remains the **escape hatch** — copy patterns from [`ReactiveLetOrders.ts`](../apps/demo/src/examples/ReactiveLetOrders.ts) when Phase 2 limits bite.

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

### Decision table (complex pages)

| You wrote… | Clay does… | You must… |
|------------|------------|-----------|
| `let x = Date.now()` / `defaultRangeFrom()` / `new Map()` | Lifts into `ui.state({ x: … })` one-shot | Nothing |
| `renderList()` at page top level (bare call) | Wraps in `ui.auto(() => { renderList(); })` | Nothing |
| `renderList()` inside `ui.row(() => …)` / other widget child | **No** auto-wrap; compile **warning** | Add `ui.auto` yourself |
| State read inside `units.filter(u => { … })` block body | **No** `ui.auto` injection (plain JS) | Nothing — or hoist with a scratch local if clearer |
| `onClick` / `ui.timer` / handler closures | Handler-only — no nested `auto` | Nothing |
| `const live = ui.state({…})` (no pragma) | Unchanged | Explicit `ui.auto` as in Phase 1 |
| Local `const detail = …` shadows lifted `let detail` | Renames in emit + compile warning | Prefer distinct names |

### What transforms

Simple `let` / `const` declarations (identifier or object/array destructuring, including **nested** and **rest** patterns) with a simple initializer **anywhere** in an eligible function body, including nested blocks (`if` / bare blocks / `try` / `switch`) and **inside loops** (loop-scoped bindings use keyed `ui.state` maps), but **not** inside nested function scopes (nested functions are separate sites only with their own `"use reactive";`):

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
| Other build-time reads (e.g. `ui.badge({ text: String(n) })`, `ui.badge(String(n))`, `ui.button(String(n))`, `ui.iconText(String(n), { icon })`) | compile-time bindText when the text expr reads state |
| Other build-time reads without bindText sugar | `ui.auto` around that statement |
| Contiguous autos with **disjoint** deps | Separate `auto` regions |
| Contiguous autos with **overlapping** deps | One shared `auto` |
| Shell / layout / handler-only writes | Stay outside any `auto` |
| Nested `ui.column(() => …)` reading outer state | Inner region / bindText inside the callback |

**Simple initializers:** literals; `undefined`; unary `±!~`; binary / conditional / template expressions of simples; property / element access of simples; identifiers (outer bindings); shallow array/object literals; **call / `new`** with simple callees and args; nullish coalescing (`??`) for destructuring defaults. **Destructuring:** simple and **nested** patterns (`let { a: { b } }`); **rest** (`let { x, ...rest }`) lifts named fields and keeps `const { ...rest }`. **Loop-scoped** `let` inside `for` / `for-of` bodies becomes keyed state (`__clay_l0_open[key]`) so each iteration keeps its own mutable slot. **Not** transformed: `await`, sibling-let refs (`let a = 1; let b = a + 1` aborts the site), spread args in initializers.

**Shadowing:** a later local `const detail = …` that reuses a lifted name is **renamed** in emit by default (`renameShadowedLocals: true`) and emits a compile warning with the generated name. Pass `{ renameShadowedLocals: false }` to warn without renaming.

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
| `@clickhouse/client` (and similar CJS) named-export breakage | Bun `onLoad` plugin in the path; prefer `--no-reactive-let` (default) or Clay’s HTTP helpers until interop is proven. Dev: `[clay-reactive-let]` warns when a rewritten file imports a known-fragile package. |

Mitigation today: leave the plugin off; use Phase 1 APIs. If you enable `--reactive-let`, only mark intentional toy/demo files with the pragma.

### Limits

- No `var`. Deeply nested patterns with rest at inner levels may abort the site.
- Sibling initializers abort the site (`let b = a + 1` when both would lift).
- Duplicate binding names in nested blocks abort the transform for that function.
- Loop-scoped state keys prefer `String(row.id)` for `for (const row of …)` loops, with loop-index fallback when `.id` is missing.
- Compile-time bindText covers `ui.label` / `label`, `ui.badge` / `badge` (positional + `{ text }`), `ui.button` / `button`, and `ui.iconText`.
- Running the demo via plain `bun apps/demo/...` does **not** load the plugin unless you register it; use `clay --reactive-let` or `--preload`.
- `const` is lifted like `let` (assignments become state writes). Prefer `let` in typed source if you reassign — `const` reassignment is a TS error before the transform runs.

**Runtime:** nested `auto` / `refreshable` trees reuse in place when structure matches (`canReuseElementTree` in `@close-by/clay-core`) — inner regions keep their ids when an outer `auto` refreshes without touching inner deps.

Tests: `packages/compiler/src/transform.test.ts`, `packages/core/src/auto.test.ts`.

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
