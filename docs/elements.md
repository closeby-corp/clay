# Elements

Each factory creates an `Element` with a wire `type` string. The React client maps that type to a ShadCN (or plain HTML) control.

## Type map

| `ui.*` | Wire `type` | Client rendering |
|--------|-------------|------------------|
| `label` | `label` | Text div |
| `button` | `button` | ShadCN `Button` |
| `input` | `input` | ShadCN `Input` (+ optional label) |
| `textArea` | `textarea` | Native textarea |
| `checkbox` | `checkbox` | ShadCN `Checkbox` |
| `switch` | `switch` | ShadCN `Switch` |
| `select` | `select` | ShadCN `Select` |
| `radioGroup` | `radiogroup` | ShadCN `RadioGroup` |
| `combobox` | `combobox` | ShadCN `Combobox` (searchable select) |
| `date` | `date` | Calendar + Popover date picker (ISO `YYYY-MM-DD`) |
| `slider` | `slider` | ShadCN `Slider` |
| `link` | `link` | `<a>` (SPA navigation for `/…`) |
| `badge` | `badge` | ShadCN `Badge` |
| `alert` | `alert` | Bordered alert box |
| `spinner` | `spinner` | Lucide spinner |
| `skeleton` | `skeleton` | ShadCN `Skeleton` placeholder |
| `avatar` | `avatar` | ShadCN `Avatar` (+ fallback) |
| `progress` | `progress` | ShadCN `Progress` (0–100) |
| `separator` | `separator` | ShadCN `Separator` |
| `icon` | `icon` | Curated Lucide icon (same keys as nav) |
| `tooltip` | `tooltip` | ShadCN `Tooltip` wrapping children |
| `markdown` | `markdown` | Client `marked` + DOMPurify |
| `html` | `html` | Trusted server HTML (`dangerouslySetInnerHTML`) |
| `image` | `image` | `<img>` |
| `upload` | `upload` | File picker → `POST /upload` → WS `upload` event (metadata + server path) |
| `stat` | `stat` | Grid of metric cards |
| `areaChart` | `areachart` | Recharts stacked area (+ legend, optional interactive ranges, `stacked?`) |
| `barChart` | `barchart` | Recharts bar (`stacked?`, `layout?: 'vertical' \| 'horizontal'`) |
| `lineChart` | `linechart` | Recharts line (+ optional interactive ranges) |
| `pieChart` | `piechart` | Recharts pie/donut (`nameKey`/`valueKey` or `series`, `innerRadius?`) |
| `radarChart` | `radarchart` | Recharts radar (`angleKey` + `series`, optional `fillOpacity`) |
| `radialChart` | `radialchart` | Recharts radial bar (`nameKey`/`valueKey` or stacked `series`, optional center text / angles) |
| `dataTable` | `datatable` | Search, filters, views, grouping, selection, reorder, editors, export, sort, pagination, actions, detail drawer |
| `tabs` | `tabs` (+ child `tab`) | ShadCN `Tabs`; optimistic `value` |
| `accordion` | `accordion` (+ child `accordionitem`) | ShadCN `Accordion`; optimistic `value` |
| `collapsible` | `collapsible` | ShadCN `Collapsible`; optimistic open (`value`) |
| `row` | `row` | Flex row |
| `column` | `column` | Flex column |
| `container` | `container` | Max-width wrapper |
| `hero` | `hero` | Centered hero |
| `card` | `card` | ShadCN `Card` |
| `app` | `app` | Dashboard shell (sidebar + inset main); usually via `ui.run({ app })` |
| `dialog` | `dialog` | Modal overlay (server-owned `open`) |
| `sheet` | `sheet` | Side panel overlay (server-owned `open`) |
| `drawer` | `drawer` | Vaul drawer overlay (server-owned `open`) |
| `refreshable` | `refreshable` | Fragment-like wrapper (`contents`) |
| *(internal)* | `root` | Page root (`min-h-screen`) |

## Events exposed to the client

Handlers stay on the server. Serialized props include `events: string[]` so the client knows what to emit.

| Element | Typical events |
|---------|----------------|
| `button` | `click` |
| `input` / `textarea` | `input`, `change` |
| `checkbox` / `switch` | `change` (and `input` if bound) |
| `select` / `slider` / `radioGroup` / `combobox` / `date` | `change` (and `input` if bound for radio/combobox/date) |
| `tabs` / `accordion` / `collapsible` | `change` |
| `upload` | `upload` (file metadata + server `path`, not bytes) |
| `dataTable` | `sort`, `filter`, `columnFilter`, `columnVisibility`, `export`, `page`, `pageSize`, `action`, `reorder`, `selectionChange`, `cellChange`, `viewChange`, `groupToggle`, `primaryAction` |
| `dialog` / `sheet` / `drawer` | `close` |

Prop names use camelCase (`onClick` → event name `click`).

## Optimistic controls

These types keep **local optimistic state** on the client so interaction is not blocked on the WebSocket round-trip:

- `input`
- `textarea`
- `checkbox`
- `switch`
- `select`
- `radioGroup`
- `combobox`
- `date`
- `slider`
- `tabs`
- `accordion`
- `collapsible`
- `datatable` (search / column filter inputs)

Server patches still reconcile when `props.value` changes (e.g. `draft.text = ''` after Add).

## Styling

Prefer Tailwind utility classes via `.classes(...)`:

```typescript
ui.label('Hello').classes('text-3xl font-bold text-muted-foreground');
```

Layout `gap` uses a small numeric scale mapped to `gap-0` … `gap-8` in the client.

The client ships a light ShadCN-style theme (CSS variables in `packages/client/src/index.css`). Override tokens at runtime with `ui.run({ css: './globals.css' })`.
