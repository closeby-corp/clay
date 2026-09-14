# URL search (query string) helpers

Ops consoles often need **shareable filter state** in the address bar
(`?tab=orders&partner=UBER&from=2026-01-01`). Page builders run on the server, so
they must not read `window.location`. Clay mirrors the existing hash helpers.

## Prefer `ui.urlState`

Like `ui.state`, but hydrated from the query string and write-through synced:

```ts
import { ui } from '@close-by/clay';

ui.page('/lastmile', () => {
  const filters = ui.urlState({
    tab: 'dashboard',
    partner: '',
    from: '',
    page: 1,
  });

  // ?partner=UBER&page=2 — defaults (dashboard / '' / 1) are omitted
  filters.partner = 'UBER';
  filters.page = 2;

  ui.select({
    label: 'Partner',
    value: filters.partner || '__all__',
    options: [
      { value: '__all__', label: 'All' },
      { value: 'UBER', label: 'Uber Eats' },
    ],
    onChange: (v) => {
      filters.partner = v === '__all__' ? '' : v;
    },
  });
});
```

| Option | Default | Role |
|--------|---------|------|
| `omitDefaults` | `true` | Drop keys whose value equals the default |
| `mode` | `'replace'` | History write (`'push'` when Back should undo) |
| `keys` | identity | Remap state keys → query names (`{ page: 'p' }`) |

Works with `ui.auto` / `bindValue` the same way as `ui.state`.

## Low-level helpers

Escape hatches when you need a one-off read/write without a reactive object:

| Helper | Role |
|--------|------|
| `ui.getUrlSearch()` | Current search **without** leading `?` (from `hello` / last set) |
| `ui.getUrlSearchParams()` | Mutable `URLSearchParams` copy of that string |
| `ui.setUrlSearch(search, opts?)` | Replace the whole query string (empty clears) |
| `ui.updateUrlSearch(patch, opts?)` | Merge keys; `null` / `undefined` / `''` deletes |

`opts.mode` is `'replace'` (default) or `'push'`. Prefer **replace** for filter
tweaks so Back is not flooded.

## Protocol

**Client → server** (`hello`):

```json
{ "op": "hello", "path": "/lastmile", "hash": "", "search": "tab=orders&partner=UBER" }
```

**Server → client**:

```json
{ "op": "setUrlSearch", "search": "tab=orders&partner=UBER", "mode": "replace" }
```

Client writes `pathname + ?search + hash` via `history.replaceState` / `pushState`.
Hash is preserved (same as `setUrlHash` preserves search).

## Path vs query

| Concern | Prefer |
|---------|--------|
| Resource identity | Path (`/orders/:id`) via `ui.page` / `ui.navigate` |
| Active tab, filters, sort, page | **Query string** (`ui.urlState`) |
| In-page focus / trace id | Hash (`ui.setUrlHash`) when you already use it |

## Limits / follow-ups

- Hydration runs on each `hello` (connect, reconnect, SPA path change). Pure
  Back/Forward that only changes the query does **not** remount yet — same
  limitation as hash today. A future `urlchange` client event (or popstate →
  hello) would close that gap and re-hydrate `urlState` in place.

## Related

- [Browser APIs](./browser-apis.md)
- [WebSocket protocol](./protocol.md) — `hello.search`, `setUrlSearch`
