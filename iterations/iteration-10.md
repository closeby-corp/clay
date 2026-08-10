# Iteration 10: Production-Grade Architecture

## Overview

Address the architectural gaps identified in the SSE/patch migration:
1. JSX server-side rendering (no more string templates)
2. Pluggable broadcast bus (not in-memory map)
3. Stop duplicating Datastar signal merge logic
4. Type-safe signals per page
5. Shell-first render + streamed content (render once)

---

## Task 1: JSX Server-Side Rendering

**Problem**: Every component returns raw HTML strings via `render(): string`. No tooling, no type-checking, painful composition.

**Solution**: Add a JSX transform (Bun's built-in or a custom Vite plugin) so components can use TSX:

```tsx
// Before
render(): string {
  return `<button id="${this.id}" class="btn btn-primary">${this.props.text}</button>`;
}

// After
render(): JSX.Element {
  return <button id={this.id} class="btn btn-primary">{this.props.text}</button>;
}
```

**Steps**:
- [ ] 1.1 Add `jsx: "react-jsx"` / `jsxImportSource: "clay/jsx-runtime"` to `tsconfig.json`
- [ ] 1.2 Create `packages/core/src/jsx-runtime.ts` — implement `jsx(tag, props, key)` returning a lightweight VNode tree (`{ tag, props, children }`)
- [ ] 1.3 Create `packages/core/src/jsx-render.ts` — walk the VNode tree and produce HTML string (this replaces `render(): string`)
- [ ] 1.4 Create `Fragment` support (`<>...</>`)
- [ ] 1.5 Port 3–5 components (Button, Label, Column, Row, Card) to TSX as a proof of concept; keep the old `render()` as fallback
- [ ] 1.6 Port all remaining components incrementally

**Why not a full framework?** A thin `jsx()` function (~50 lines) gives us all the ergonomics of JSX without pulling in React. The VNode tree is ephemeral — it's immediately rendered to a string and discarded.

---

## Task 2: Pluggable Broadcast Bus

**Problem**: `signalStreamRegistry` is a per-process `Map<string, ...>`. SSE streams are tied to one server instance. Horizontal scaling = broken SSE.

**Solution**: Extract an interface `PatchBus` that `ClayServer` depends on. Ship two implementations:

- `InMemoryPatchBus` — current `Map`-based approach (single process)
- `RedisPatchBus` — fan-out via Redis Pub/Sub (multi-process)

**Steps**:
- [ ] 2.1 Define `PatchBus` interface in `packages/core/src/patch-bus.ts`:
  ```ts
  export interface PatchBus {
    subscribe(ctxId: string, writer: StreamWriter, abort: AbortController): void;
    unsubscribe(ctxId: string): void;
    publish(ctxId: string, patch: PatchOptions): void;
    publishAll(patch: PatchOptions): void;
    getActiveIds(): string[];
  }
  ```
- [ ] 2.2 Refactor `signal-stream.ts` → `InMemoryPatchBus` (keep existing behavior)
- [ ] 2.3 Rewrite `patchResponse()` and `createStreamResponse()` to accept `PatchBus`
- [ ] 2.4 Update `ClayServer` to receive `PatchBus` in its constructor (defaults to `InMemoryPatchBus`)
- [ ] 2.5 Create `RedisPatchBus` in a new `packages/server/src/patch-bus-redis.ts` using `@upstash/redis` or `ioredis`
- [ ] 2.6 Wire `setGlobalStreamPatcher` through the bus instead of directly calling `signalStreamRegistry`

**Key insight**: The `ctxId` becomes the Redis channel name. Any server instance can `publish(ctxId, patch)` and the SSE-connected instance receives it.

---

## Task 3: Stop Duplicating Datastar Signal Logic

**Problem**: `importSignals/exportSignals/collectSignalsFromContext/serializeSignals/applySignalsToContext` — this is all stuff Datastar's client-side merge already does.

**Solution**: Trust Datastar to manage client-side signal state. The server should only:
1. Define initial signals in `data-signals` on the shell
2. Push signal patches via SSE when they change
3. Read signal values from incoming POST requests

Remove the local signal store (`namedStates` with `PAGE_PREFIX`) and instead use a simpler model: a plain `Map<string, unknown>` per context that is purely a "write-through cache" — it mirrors what Datastar has on the client, but the source of truth is the client.

**Steps**:
- [ ] 3.1 Audit all call sites of `importSignals`, `exportSignals`, `collectSignalsFromContext`, `serializeSignals`, `applySignalsToContext`
- [ ] 3.2 Replace the `PAGE_PREFIX`/`namedStates` dual storage with a flat `signalCache: Map<string, unknown>` on `RenderContext`
- [ ] 3.3 Signal cache is only populated from incoming POST bodies and used as initial values for `data-signals` — never as authoritative state
- [ ] 3.4 Remove `PAGE_PREFIX`, `signalToPageKey`, `pageKeyToSignal`, `serializeSignals`, `applySignalsToContext` from `signals.ts`
- [ ] 3.5 Simplify `RenderContext.exportSignals()` to just `Object.fromEntries(this.signalCache)`
- [ ] 3.6 Simplify `RenderContext.importSignals()` to just merge into `this.signalCache` + call `syncValueComponentsFromSignals`

**Result**: ~80 lines of signal plumbing deleted. The server is purely a signal publisher, not a signal manager.

---

## Task 4: Type-Safe Signals Per Page

**Problem**: Signals flow as `Record<string, unknown>` everywhere. A typo like `counts` vs `count` is a runtime error.

**Solution**: Allow each page to declare a `Signals` interface. The compiler package (which already exists) generates the serialization/deserialization helpers.

**Steps**:
- [ ] 4.1 Define a base type in `packages/core/src/signals.ts`:
  ```ts
  export type SignalMap<T extends Record<string, unknown>> = {
    [K in keyof T]: State<T[K]>;
  };
  ```
- [ ] 4.2 Add a `defineSignals<T>()` function that returns typed helpers:
  ```ts
  const s = defineSignals<{ count: number; name: string }>();
  const count = s.state('count', 0);   // State<number> ✓
  const name = s.state('name', '');     // State<string> ✓
  const bad = s.state('counts', 0);     // Type error ✨
  ```
- [ ] 4.3 Update the `page` decorator / page creation to accept a generic signal type so `context.exportSignals()` returns the typed shape
- [ ] 4.4 Update `readClaySignals` in `datastar.ts` to parse into a generic type
- [ ] 4.5 Add a `ts-expect-error` test in the compiler fixtures for a mismatched signal name

**Note**: Full type safety across the wire (client → server → client) requires shared types between server and client. For now, focus on server-side type safety — the client already handles its own signal merging.

---

## Task 5: Shell-First Render + Streamed Content

**Problem**: On initial page load, the server renders the full page HTML (bootstrap + content). Then the SSE stream connects and must reconcile with what was already rendered. Dirty tracking (`DirtyKind`) tries to avoid double-render but the architecture still allows it.

**Solution**: The server always renders the shell (bare HTML, CSS, JS, stream connect `<div>`) and immediately pushes the page content as the first SSE patch. The initial request never includes content — just the shell.

**Steps**:
- [ ] 5.1 Split `PageTemplate.render()` into:
  - `shell()` — renders `<html><head>...<body><div id="clay-stream">...<div id="app" data-signals="..."></div></body></html>` (no inner content)
- [ ] 5.2 On first page GET, instead of:
  ```
  render() → template.render(html, ctxId, signals)
  ```
  Do:
  ```
  render() → template.shell(ctxId, signals)
          → push SSE patch with { elements: content, selector: '#app' }
  ```
  This means the browser loads the shell, Datastar connects the stream, and the content arrives milliseconds later as the first patch.

- [ ] 5.3 Remove the server-side render from the initial HTTP response body for page routes — the stream handler now provides content
- [ ] 5.4 Add a loading placeholder inside `#app` (spinner or skeleton) so the user sees something while the stream connects
- [ ] 5.5 Remove `DirtyKind` tracking — with shell-first, every render is an SSE push; there is no "elements vs signals" distinction at render time
- [ ] 5.6 Simplify `handleEvent` to always push patches, never return HTML

**Benefits**:
- Render happens exactly once per state change
- No "render twice" problem (HTML response + SSE patch)
- Server can compute the full response asynchronously (await DB, APIs, etc.) without blocking the initial HTML
- The shell is aggressively cacheable (CDN, etag, etc.)

---

## Migration Strategy

Each task is independent and can be done in parallel, except:

```
Task 5 (shell-first) depends on Task 3 (Datastar simplification) — cleaner signal model
Task 1 (JSX) is fully independent — start anytime
Task 2 (broadcast bus) is fully independent — start anytime
Task 4 (type-safe signals) depends on Task 3
```

**Recommended order**: 2 → 3 → 4 → 1 → 5 (or 1 + 2 in parallel)

---

## Acceptance Criteria

- [ ] All components render correctly under JSX (no HTML escaping bugs, no missing attributes)
- [ ] `PatchBus` interface works with both in-memory and Redis backends
- [ ] Redis backend passes the existing `server.test.ts` suite
- [ ] Signal cache is a simple write-through map; `PAGE_PREFIX` and friends are deleted
- [ ] `defineSignals<T>()` catches type errors at compile time
- [ ] Page shell loads instantly; content arrives via SSE (verified with `curl` + `--no-buffer`)
- [ ] All existing tests pass
- [ ] Demo apps (Counter, Todo, Chat, Dashboard) work unchanged
