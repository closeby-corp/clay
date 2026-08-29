# Ops console patterns

Dense internal tools (live feeds, master–detail, logs/traces) push Clay past card dashboards. Prefer Phase 1 reactivity ([Concepts](./concepts.md#canonical-recipe-state--auto--timer)) and the helpers below.

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

`ui.list` is a **grouped drag-and-drop** list — wrong tool for a live ops feed. Build rows yourself:

```ts
ui.auto(() => {
  for (const unit of live.units) {
    ui.row({ gap: 2, className: 'items-center border-b py-2' }, () => {
      ui.badge(unit.status, { size: 'xs', color: unit.ok ? 'emerald' : 'red' });
      ui.button(unit.id, {
        variant: 'link',
        className: 'h-auto p-0 font-mono text-xs',
        onClick: () => {
          live.selectedId = unit.id;
        },
      });
      ui.copyButton(unit.id, { size: 'sm', variant: 'ghost' });
      ui.label(unit.summary).classes('text-xs text-muted-foreground truncate');
    });
  }
});
```

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
