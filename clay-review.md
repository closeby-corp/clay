# Clay framework review — from building UQ Hub

**Context:** [uq-hub](../) is an internal ops dashboard for Lastmile, SmartDelivery, SigNoz/ClickHouse, Configuration Manager, and sUQer. It was built almost entirely on Clay **0.1.0** (`@close-by/clay` + `@close-by/clay-cli`) over several days as a real multi-page product, not a toy demo.

**Audience:** Clay maintainers / stakeholders evaluating readiness for internal tools and what to prioritize next.

**Verdict:** Clay is a strong fit for server-owned ops consoles. We shipped a useful hub faster than we would have with a separate React SPA + API. At 0.1.0 the model is right; the sharp edges below are the ones that repeatedly slowed us down or forced workarounds.

---

## 1. What we built on Clay

| Page | Clay features heavily used |
|------|----------------------------|
| Home (status) | `state`/`auto`, badges, timers, charts-ish layout |
| Orders (live feed) | `state`, `auto`, `timer`, `dataTable`, `flow`, `dialog`, `collapsible`, `resizable`, badges |
| Lastmile / Smart Delivery / Configuration | forms, tables, tabs, confirm/notify |
| Health / Logs / Traces | tables, selects, refreshable panels |
| SigNoz | `html` iframe + `runJavaScript` |
| Agent | `ai.chat` |

Boot paths used:

- Day-to-day: `bunx clay ./pages --app …` via `scripts/dev.ts`
- Production-style: library mode `ui.loadPages` + `ui.run` in `index.ts`

Nav is entirely driven by `export const pageMeta` + `ui.navFromPages()`.

---

## 2. What worked well

### Server-owned UI is the right default for ops tools

Page handlers call ClickHouse, Lastmile HTTP, Configuration Manager, and SmartDelivery directly. There is no parallel “BFF for the UI” layer. For an ops hub that is mostly read + occasional write, that is a large productivity win.

### Multi-page app shell comes free

`ui.page` + `pageMeta` (label, icon, order) + `--app` / `navFromPages()` gave us a coherent sidebar without inventing a router. Ordering and icons are good enough for a real product.

### Reactive blocks scale to complex screens

Orders is the stress test: live polling, filters, pagination, detail split, re-dispatch, trace flow dialog, URL hash focus. `ui.state` + `ui.auto` + `ui.timer` held that together once we stopped fighting `refreshable` for everything.

### Component coverage is broad enough

We used, without needing custom React:

- Layout: `row`, `column`, `container`, `card`, `separator`, `resizable`, `tabs`, `collapsible`, `dialog`, `tooltip`
- Data: `dataTable`, `flow`, charts (`pie` / `bar` / `area` on older pages)
- Feedback: `badge`, `alert`, `spinner`, `notify`, `confirm`
- Forms: `input`, `select`, `button`, `textArea`, `checkbox`
- Special: `ai.chat`, `codeBlock`, `html`, `icon`, `link`

That is enough to ship a dense ops console without falling back to a SPA.

### Escape hatches exist when needed

`ui.runJavaScript` (open SigNoz in a new tab) and `ui.html` (iframe, status dots) kept us unblocked. Prefer first-class APIs long-term, but the hatches are valuable.

### Styling via Tailwind / shadcn tokens works

Injecting `globals.generated.css` and using `className` / `.classes(...)` let us match an ops-console aesthetic (flat lists, compact badges, muted meta) without forking the Clay client.

---

## 3. Friction and gaps (with proposals)

These are ordered by impact on our velocity and correctness.

### 3.1 Reactive-let must be disabled — treat as opt-in until fixed

**Experience:** Default reactive-let transform broke async page state (blank UI / mount errors) and also broke `@clickhouse/client` CJS named exports, forcing a custom HTTP ClickHouse client.

**Workaround:** Always run with `--no-reactive-let` (documented in our README and hardcoded in `scripts/dev.ts`).

**Proposal:**

1. Keep reactive-let **off by default** until the async / import story is solid.
2. Document the known failure modes in Getting Started (blank mount, CJS interop).
3. If the transform stays, add a clear runtime warning when it rewrites files that import known-fragile packages.

### 3.2 Client-only APIs are easy to misuse from server handlers

**Experience:** Orders copy used `navigator.clipboard` and URL sync used `window` / `location.hash`. Those only exist in the browser; on the Clay server they are no-ops or throw. Clay already exposes `ui.clipboard(content)` and `ui.runJavaScript`, but it is easy to reach for DOM APIs out of habit.

**Proposal:**

1. Document a short “browser APIs” page: use `ui.clipboard`, `ui.runJavaScript`, and (if added) URL helpers — never `window` / `navigator` in page code.
2. Add first-class helpers for common needs:
   - `ui.clipboard(text)` (exists — make it the documented path)
   - `ui.setUrlHash` / `ui.getUrlHash` or `ui.queryParams` synced to the client session
   - Optional `ui.openExternal(url)` instead of raw `runJavaScript('window.open…')`
3. Consider a lint rule or types that mark DOM globals as unavailable in Clay page modules.

### 3.3 `refreshable` vs `state`/`auto` mental model is still fuzzy

**Experience:** Early pages used `refreshable` + local `var` + manual `panel.refresh()`. Orders needed `state`/`auto`. Lastmile still mixes patterns. Misplacing mutable state *inside* a builder silently resets it on rebuild.

**Proposal:**

1. One canonical recipe in docs: “async load → put results in `ui.state` → wrap UI in `ui.auto`.”
2. Deprecate or demote `refreshable` for new apps, or show a clear decision table:

   | Need | Use |
   |------|-----|
   | Data that drives the tree | `ui.state` + `ui.auto` |
   | One-shot structural rebuild | `refreshable` |
   | Polling | `ui.timer` mutating state |

3. Runtime warning when a builder closes over locals that look like they should be state (optional / debug mode).

### 3.4 Icon + button composition is awkward

**Experience:** We wrapped `ui.icon` + `ui.button` in helpers (`src/ui-icons.ts`) because there is no first-class `icon` on buttons / heading pattern. Nav icons via Lucide name strings work well; inline action buttons less so.

**Proposal:**

- `ui.button(label, { icon: 'copy', … })`
- `ui.iconButton({ icon, label?, … })` for toolbar density
- Document the curated Lucide subset (or allow full set with tree-shaking story)

### 3.5 Tailwind utilities require an app-side CSS pipeline

**Experience:** Clay’s shipped client CSS does not include arbitrary utilities we need (`text-[10px]`, `w-[32rem]`, custom animations). We run Tailwind CLI over `pages/` → `globals.generated.css` and pass it to `ui.run({ css })`. That works, but every Clay app will reinvent it.

**Proposal:**

- Document the recommended Tailwind v4 setup for Clay apps (scan `pages/`, inject via `css`).
- Or ship an optional `@close-by/clay-tailwind` preset / example app template that already wires watch + inject.
- Clarify in docs: runtime CSS can override tokens; it cannot invent utilities unless scanned.

### 3.6 Typing and DX polish

**Experience:**

- Prop types are often pulled via `Parameters<typeof ui.button>` instead of exported `ButtonProps`.
- CLI reload leaves transient `pages/_clay-reload-*.ts` stubs in the tree (noise / TS errors under `tsc`).
- `ui.ai.chat` encourages imperative `var` + `setMessages` patterns that feel different from `state`/`auto`.

**Proposal:**

- Export public prop types from `@close-by/clay` / clay-components.
- Write reload stubs outside `pages/` or to a gitignored temp dir.
- Align AI chat with the same state model as other pages (or document the intentional exception).

### 3.7 Dense ops UI patterns (nice-to-have)

Orders pushed Clay toward a high-density “ops console” rather than card dashboards. Gaps we papered over:

| Need | Current workaround | Proposal |
|------|--------------------|----------|
| Status chips | `ui.badge` + heavy `className` | Size variants (`xs`) + semantic tones (`success` / `warning`) |
| Split master–detail | `ui.resizable` | Documented pattern + default sizes |
| Live feed rows | Custom rows + link buttons | Optional `list` / `feedItem` primitive |
| Copy-to-clipboard actions | Manual notify + clipboard | `ui.copyButton(text)` |
| External deep links | `html` + `runJavaScript` | `ui.externalLink` |

None of these are blockers; they are where Clay could own the ops niche more deliberately.

### 3.8 Dual entrypoints (CLI vs library)

**Experience:** Dev uses CLI; Docker/prod uses `index.ts` + `clientDir` pointing at `clay-cli/client-dist`. Easy to drift on port, CSS path, and `--no-reactive-let`.

**Proposal:** Single recommended production path (library mode) with CLI as a thin wrapper that calls the same `configureRun` / `_run.ts` merge. Document the contract for `clientDir` so apps do not hardcode `node_modules` paths if avoidable.

---

## 4. Security / ops notes (from real traffic)

Not Clay bugs, but relevant for Clay apps that sit in front of logs/traces:

- Structured logs can contain secrets (API keys, partner tokens). Clay apps that surface log bodies should assume scrubbing is the app’s job — a small `ui.codeBlock` “sensitive” mode or docs warning would help.
- Server-driven UI means every interaction hits the Bun process. For internal VPN tools that is fine; for broader exposure, Clay should document auth session hooks / role-filtered `navFromPages({ role })` (API already hints at this).

---

## 5. Suggested priority for Clay 0.x

| Priority | Item | Why |
|----------|------|-----|
| P0 | Reactive-let off by default + docs | Silent blank UIs are costly |
| P0 | Docs: never use DOM globals; prefer `ui.clipboard` / URL / open helpers | Correctness |
| P1 | Canonical `state` + `auto` (+ timer) recipe; clarify `refreshable` | Onboarding |
| P1 | Button `icon` / `iconButton`; export prop types | Daily DX |
| P2 | Tailwind app template / preset | Every app needs it |
| P2 | Reload stubs out of `pages/` | Clean trees / CI |
| P3 | Ops density: badge tones/sizes, copy button, external link | Niche fit |

---

## 6. Bottom line

Clay’s core bet — **server builds the tree, React client renders ShadCN, events come back over WebSocket** — is a good match for internal ops products. UQ Hub would have been slower and more fragmented as a SPA plus ad-hoc APIs.

What we want from Clay next is not a new paradigm, but **hardening of the current one**: safe defaults around reactive-let, clear client/server API boundaries, one reactive recipe, and small ergonomic APIs (icons, clipboard, URL, CSS template) that remove the workarounds we accumulated.

We are happy to keep using Clay as the hub grows and can provide more concrete repros for reactive-let / clipboard / reload-stub issues if useful.

---

## Appendix — environment

| Item | Value |
|------|--------|
| Clay packages | `@close-by/clay` / `@close-by/clay-cli` **0.1.0** (plus clay-core, clay-components, clay-server, …) |
| Runtime | Bun |
| App | uq-hub — multi-page ops dashboard |
| Notable pages | Orders (live SigNoz feed), Home status, Lastmile, Agent |
| CSS | Tailwind v4 CLI → `globals.generated.css` injected via `ui.run({ css })` |
| Required flag | `--no-reactive-let` |
