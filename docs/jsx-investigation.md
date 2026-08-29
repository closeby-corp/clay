# JSX investigation — context & recommendation

Status: **investigation complete** (2026-08). Spike B POC landed in `@close-by/clay-core/jsx-runtime` (experimental). Spike A deferred.

Related backlog: [TASKS.md](../TASKS.md) Later → Investigate `ui.jsx`. Historical HTMX-era note: [iterations/iteration-10.md](../iterations/iteration-10.md) (string `render()` → JSX; **superseded** by today’s Element + WebSocket model).

---

## Problem

Apps (notably UQ Hub) still build markup as **strings** and pass them to `ui.html`:

| Use (uq-hub) | Example |
|--------------|---------|
| Status dots | `` ui.html(`<span class="… rounded-full ${color}">`) `` |
| Sparkline bars | `` ui.html(`<div style="width:…;background:…">`) `` |
| SigNoz iframe | `` ui.html(`<iframe src="${url}" …>`) `` |
| Trace icon link | HTML `<a>` + inline SVG string |

Pain:

1. No IDE structure / prop types / rename
2. Easy XSS if values aren’t escaped
3. Can’t compose real Clay components inside the blob
4. Client path is `dangerouslySetInnerHTML` — no Clay events inside the string

Goal: **author markup as markup** with IDE support for tags + user-defined components — without inventing a second UI stack.

---

## Current architecture (constraints)

```
Page builder (Bun)  →  Element tree  →  JSON mount/patch  →  ElementRenderer (React)
```

- `new Element(type, props)` **attaches immediately** to `getCurrentParent()` via `attachToContext`.
- Layout uses **callback children**: `ui.row(props, () => { ui.button(…) })` so children run *after* the parent is on the stack.
- Standard JSX evaluates **children before parents**. That fights attach-on-construct unless we create nodes **detached** and **reparent**.

POC fix: `Element.adopt(child)` + `withDetached(() => new Element(…))` in `jsx()`.

---

## Spike A — JSX → static HTML → `ui.html`

```tsx
ui.html(renderToStaticMarkup(
  <div className="flex">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
  </div>
));
```

| Pros | Cons |
|------|------|
| Familiar HTML tags | Still opaque to Clay (one `html` node) |
| IDE for DOM + React-ish function components | **No** `onClick` / Clay handlers inside |
| Fits iframe / SVG blobs | Pulls React (or similar) into the **server** app, or a custom HTML serializer |
| | Duplicates styling (Tailwind must scan these modules too) |

**Verdict:** Only useful for true opaque HTML (iframe, third-party SVG). Most UQ Hub dots/bars should become Clay nodes instead. Prefer first-class `ui.iframe` over A for SigNoz embed.

---

## Spike B — JSX → Clay `Element` tree

```tsx
/** @jsxImportSource @close-by/clay-core */
function StatusDot({ ok }: { ok: boolean }) {
  return <badge text={ok ? 'up' : 'down'} size="xs" color={ok ? 'emerald' : 'red'} />;
}

ui.page('/', () => {
  <row gap={2}>
    <StatusDot ok={true} />
    <button text="Refresh" icon="refresh-cw" onClick={() => void load()} />
  </row>;
});
```

| Pros | Cons |
|------|------|
| Same protocol / renderer / events | Intrinsics are Clay types (`button`, `row`), **not** HTML (`div`, `span`) |
| IDE + custom components with props | Children-first requires `adopt` (POC done) |
| Mix with `ui.*` under same parent | Layout/API mismatch: `ui.button(text, props)` vs `<button text props>` |
| Aligns with long-term DX | Need docs so people don’t expect DOM JSX |

**POC (landed):**

- `Element.adopt`
- `@close-by/clay-core/jsx-runtime` (`jsx` / `jsxs` / `Fragment`)
- Tests: `packages/core/src/jsx-runtime.test.ts`

Opt-in:

```json
"compilerOptions": {
  "jsx": "react-jsx",
  "jsxImportSource": "@close-by/clay-core"
}
```

(Use `.tsx` page modules; keep default Clay apps on `.ts` + `ui.*` until DX is documented. Resolves to `@close-by/clay-core/jsx-runtime`.)

---

## Mixing `ui.*` and JSX

| Pattern | Supported? |
|---------|------------|
| JSX inside `ui.row(() => { … })` | Yes — `jsx()` attaches to current parent |
| `ui.button` inside a function component used as `<Foo />` | Yes — if the component runs under `withParent` / current session |
| `<div>` HTML intrinsic | **No** (Spike B) — use Clay `container` / `row` / future `box`, or Spike A / `ui.html` |
| `ui.html` string escape hatch | Keep forever for trusted blobs |

---

## Trust model

| API | Trust |
|-----|--------|
| `ui.html(string)` | Trusted HTML only (XSS if user data interpolated) |
| Spike A static markup | Same as `ui.html` once stringified |
| Spike B Clay JSX | Props go through Element / protocol; handlers stay on server — **preferred** |

---

## Recommendation (phased)

### Phase 0 — eliminate most strings without JSX (high ROI)

Ship small primitives that replace UQ Hub’s `ui.html` call sites:

1. **`ui.iframe({ src, title?, className?, … })`** — SigNoz embed  
2. **`ui.dot({ color / tone, className? })`** or document `badge` + `size: 'xs'` as status chip (dots may still want a 6px circle — tiny `container`/`html` one-liner ok)  
3. Prefer **`ui.externalLink` / `ui.copyButton`** (already shipped) over HTML `<a>` icon buttons; SVG brand icons can stay `ui.html` until `ui.image` / icon upload exists  

### Phase 1 — productize Spike B (recommended north-star)

1. Export jsx runtime from `@close-by/clay` as well (`jsxImportSource: "@close-by/clay"`) for one import path  
2. Document Clay intrinsics list + function-component rules in `docs/jsx.md`  
3. Demo page mixing `<row>` JSX with `ui.auto` / `ui.state`  
4. Consider `ui.jsx` as a **hyperscript alias** only if needed; automatic runtime is enough  
5. Do **not** default `jsxImportSource` in the Clay monorepo root (client already uses React JSX)

### Phase 2 — Spike A only if still needed

If trusted SVG/iframe authoring remains painful after Phase 0–1, add optional `renderClayHtml(vnode)` **without** depending on React (small tag→string walker), feeding `ui.html`. Otherwise skip.

---

## Decision

| Spike | Decision |
|-------|----------|
| **B (Clay JSX)** | **Pursue** — POC in core; next = docs + clay re-export + demo |
| **A (SSR HTML)** | **Defer / maybe skip** — replaced by `ui.iframe` + Clay nodes for hub cases |
| **`ui.html(string)`** | **Keep** as escape hatch |

---

## Open questions

1. Should Clay intrinsics use DOM-like names (`div` → `container`) for familiarity, or stay honest (`container` / `row`)?  
2. TypeScript JSX intrinsic elements (`JSX.IntrinsicElements`) for autocomplete of `button` / `row` props?  
3. Can `ui.auto(() => <row>…</row>)` be the documented reactive pattern once B is stable?
