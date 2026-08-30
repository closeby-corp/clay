# Ops console patterns

Dense internal tools (live feeds, master–detail, logs/traces) push Clay past card dashboards. Prefer Phase 1 reactivity ([Concepts](./concepts.md#canonical-recipe-state--auto--timer)) and the helpers below.

**Runnable dogfood:** `/examples/ops-console` (`OpsConsoleDemo.ts`) — one Orders-shaped surface using `filterBar`, `inputGroup`, `feedList`/`feedRow`, `descriptionList`, `staticTable`, `pagination`, `empty`, `notice`, and `toggle`. Use that page to find API friction before adding more wire types.

## Status chips

```ts
ui.badge('ok', { size: 'xs', color: 'emerald' });
ui.badge('warn', { size: 'xs', color: 'amber', variant: 'outline' });
ui.badge('error', { size: 'xs', color: 'red' });
```

| Prop | Notes |
|------|--------|
| `size: 'xs'` | Compact ops chip (`h-5` / `text-[10px]`) |
| `color` | Named (`green`, `red`, `amber`, …) or CSS (`#22c55e`); overrides `variant` |
| `variant` | `default` / `secondary` / `destructive` / `outline` when `color` unset |

## Copy & external links

```ts
ui.copyButton(traceId); // icon-only
ui.copyButton(traceId, { label: 'Copy', size: 'sm' });

ui.externalLink('Open in SigNoz', signozUrl);
// or
ui.link('Docs', 'https://example.com', { external: true });
ui.openExternal(signozUrl); // no visible control — protocol helper
```

Never use `navigator.clipboard` / `window.open` in page code — see [Browser APIs](./browser-apis.md).

## Master–detail with `ui.resizable`

```ts
const live = ui.state({ selectedId: null as string | null, rows: [] as Row[] });

ui.auto(() => {
  ui.resizable(
    { orientation: 'horizontal', className: 'h-[calc(100vh-8rem)] w-full min-h-[24rem]' },
    (r) => {
      r.panel({ defaultSize: 40, minSize: 28 }, () => {
        ui.auto(() => {
          for (const row of live.rows) {
            ui.button(row.id, {
              variant: row.id === live.selectedId ? 'secondary' : 'ghost',
              className: 'w-full justify-start',
              onClick: () => {
                live.selectedId = row.id;
              },
            });
          }
        });
      });
      r.panel({ defaultSize: 60, minSize: 36 }, () => {
        ui.auto(() => {
          const row = live.rows.find((x) => x.id === live.selectedId);
          if (!row) {
            ui.label('Select a row').classes('text-sm text-muted-foreground');
            return;
          }
          // detail…
          ui.label(row.id);
        });
      });
    },
  );
});
```

Keep **separate** `ui.auto` regions for list vs detail so selection updates do not remount the whole shell. Default panel sizes (`defaultSize` / `minSize`) are percentages.

## Live feed rows (not `ui.list`)

`ui.list` is a **grouped drag-and-drop** list — wrong tool for a live ops feed. Use **`ui.feedList`** + **`ui.feedRow`** (app still owns polling, merge, and filters):

```ts
ui.auto(() => {
  ui.feedList(() => {
    for (const unit of live.units) {
      ui.feedRow(
        {
          selected: live.selectedId === unit.id,
          status: { color: unit.ok ? 'emerald' : 'red' },
          title: unit.id,
          meta: unit.summary,
          issue: unit.error ?? undefined,
          marker: unit.isNew ? 'new' : undefined,
          trailing: () => formatRelative(unit.at, live.clock),
          onClick: () => {
            live.selectedId = unit.id;
          },
          onTrailingClick: () => toggleAbsoluteTime(unit.id),
        },
        () => {
          for (const chip of unit.chips) {
            ui.badge(chip.label, { size: 'xs', color: chip.color });
          }
        },
      );
    }
  });
});
```

| Primitive | Role |
|-----------|------|
| `ui.feedList` | Bordered `divide-y` container — default ops feed chrome |
| `ui.feedRow` | One row: status dot, link title, meta / issue / hint, trailing time |
| Footer callback | Optional chips or extra content when there is no `issue` line |

Manual `ui.row` composition still works when you need a custom layout.

## Filter toolbar

Use **`ui.filterBar`** for the chip row + control slot pattern (Orders-style pages):

```ts
ui.auto(() => {
  ui.filterBar(
    {
      chips: [
        { id: 'status', label: 'Status', value: live.statusFilter },
        { id: 'q', label: 'Search', value: live.query },
      ],
      onRemoveChip: (id) => {
        if (id === 'status') live.statusFilter = '';
        if (id === 'q') live.query = '';
      },
      onClear: () => {
        live.statusFilter = '';
        live.query = '';
      },
    },
    () => {
      ui.select({
        options: statusOptions,
        value: live.statusFilter,
        onChange: (v) => {
          live.statusFilter = v;
        },
      });
      ui.input({
        value: live.query,
        placeholder: 'Search…',
        onInput: (v) => {
          live.query = v;
        },
      });
    },
  );
});
```

For **`ui.dataTable`**, pass `showFilterChips: true` to surface active search + column filters as removable chips in the table chrome (`views` remain the saved-view tabs API).

## Infinite scroll / load-more

**Blessed pattern for overflow feeds** (master–detail panels): `ui.viewportEnter` with `root: 'nearest-scroll'`. Remount the sentinel while a page is in flight if you need to re-arm after `once: true`:

```ts
ui.auto(() => {
  if (live.loadingMore) {
    ui.label('Loading…').classes('text-xs text-muted-foreground p-2');
    return;
  }
  if (!live.hasMore) return;
  ui.viewportEnter(
    {
      once: true,
      root: 'nearest-scroll',
      rootMargin: '120px',
      onEnter: () => void loadNextPage(),
    },
    () => {
      ui.label(' ').classes('h-1');
    },
  );
});
```

Alternative when you already wrap the list in **`ui.scrollArea`**: use `onNearEnd` on the scroll area (scroll-root is built-in). Prefer one pattern per surface — `viewportEnter` + `nearest-scroll` does **not** require `scrollArea`.

## Logs / traces — sensitive bodies

Structured logs often contain API keys or partner tokens. Scrubbing is the **app’s** job; Clay can still reduce shoulder-surfing:

```ts
ui.codeBlock({
  code: rawLogLine,
  language: 'json',
  sensitive: true, // blurred until Reveal; copy disabled until then
});
```

Still redact before display when possible. Prefer VPN + auth for hubs that surface production logs.

## Auth + role-filtered nav

Nav filtering is UX only — always enforce roles in the page builder.

```ts
// pageMeta
export const pageMeta = {
  label: 'Admin',
  icon: 'settings',
  order: 90,
  roles: ['admin'],
};

// shell
ui.run({
  authSecret: process.env.CLAY_AUTH_SECRET!,
  app: {
    title: 'Hub',
    nav: () => ui.navFromPages({ role: currentUser.role }),
  },
});

// page
ui.page('/admin', () => {
  requireRole('admin'); // @close-by/clay-auth
  // …
});
```

See `/examples/auth` and [API — auth](./api.md).

## `ui.ai.chat` and state

`AiChatElement` owns messages via `setMessages` / imperative updates. That is intentional — the chat widget is a stateful client control, not a pure `auto` tree.

```ts
const session = ui.state({ conversationId: '…' });
var messages: AiChatMessage[] = [/* welcome */];

const chat = ui.ai.chat({
  messages,
  onSubmit: async (text) => {
    // update messages, then:
    chat.setMessages(messages);
  },
});
```

Use `ui.state` for surrounding controls (conversation id, busy flags). Prefer documenting this exception over forcing chat through `ui.auto` (would remount the composer). Full API: [AI UI](./ai.md).
