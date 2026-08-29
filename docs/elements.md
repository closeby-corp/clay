# Elements

Each factory creates an `Element` with a wire `type` string. The React client maps that type to a ShadCN (or plain HTML) control.

## Type map

| `ui.*` | Wire `type` | Client rendering |
|--------|-------------|------------------|
| `label` | `label` | Text div |
| `button` | `button` | ShadCN `Button` |
| `input` | `input` | ShadCN `Input` (+ optional label / `error`) |
| `textArea` | `textarea` | Native textarea (+ optional `error`) |
| `checkbox` | `checkbox` | ShadCN `Checkbox` (+ optional `error`) |
| `switch` | `switch` | ShadCN `Switch` (+ optional `error`) |
| `select` | `select` | ShadCN `Select` (+ optional `error`) |
| `radioGroup` | `radiogroup` | ShadCN `RadioGroup` (+ optional `error`) |
| `combobox` | `combobox` | ShadCN `Combobox` (searchable select; optional `error`) |
| `date` | `date` | Calendar + Popover date picker (ISO `YYYY-MM-DD`; optional `error`) |
| `slider` | `slider` | ShadCN `Slider` (+ optional `error`) |
| `rating` | `rating` | Star rating (`value` / `max`; optional `error`) |
| `colorPicker` | `colorPicker` | Hex color picker (swatches + native input; optional `error`) |
| `tags` | `tags` | Multi-tag chip input (`options?`, `creatable?`; optional `error`) |
| `codeBlock` | `codeBlock` | Read-only Shiki-highlighted code (`language?`, `showCopy?`, `sensitive?`) |
| `tree` | `tree` | Nested tree (`nodes`, `selected?`, `expanded?`) |
| `editor` | `editor` | Domternal rich text (`format?: 'html' \| 'markdown'`) |
| `kanban` | `kanban` | Board (`columns` with cards; optional `lanes`; owns order + selection; card drawer; `cardMove`/`cardSelect` settle defaults) |
| `list` | `list` | Dense vertical grouped list (`groups` with items; owns order; `itemMove` settle defaults) |
| `relativeTime` | `relativeTime` | Multi-timezone clock (`timezones`; ticks when `date` omitted) |
| `qrCode` | `qrCode` | SVG QR from `value` (`size?`, `level?`) |
| `imageZoom` | `imageZoom` | Image with click-to-zoom overlay (leave `image` plain) |
| `imageCrop` | `imageCrop` | Image cropper (`src`, `aspect?`; emits data URL) |
| `gantt` | `gantt` | Project timeline (`rows` + markers + dependency arrows; owns dates; `itemMove` / `markerAdd` settle defaults) |
| `flow` | `flow` (+ `flowNode`) | Interactive diagram (`@xyflow/react`; owns edges/positions; Clay node bodies; dagre `layout()`; group/`parentId`; typed/labeled edges; custom type keys + client registries; `nodeMove`/`connect` settle defaults) |
| `ai.loader` | `aiLoader` | AI loading state (`variant`: drive/dots/orbit/pixel; optional `startedAt` elapsed) |
| `ai.thinking` | `aiThinking` | Expandable thinking traces |
| `ai.message` | `aiMessage` | Chat message (markdown, sources, actions, follow-ups, streaming) |
| `ai.chat` | `aiChat` | Tabbed thread + composer (`AiChatElement` owns messages/tab) |
| `ai.promptBar` | `aiPromptBar` | Composer with sources / commands / model / dictate stub |
| `ai.codeBlock` | `aiCodeBlock` | AI-styled code block (`filename?`, `streaming?`) |
| `ai.approval` | `aiApproval` | Human-in-the-loop approval card |
| `ai.toolChips` | `aiToolChips` | Compact tool / edit chips |
| `ai.tasks` | `aiTasks` | Nested agent task rows |
| `ai.recommendation` | `aiRecommendation` | Suggestion + confidence + alternatives |
| `ai.context` | `aiContext` | Retrieved context chunks |
| `ai.diffTable` | `aiDiffTable` | Compact proposed-edit table |
| `ai.insights` | `aiInsights` | Paged insight cards |
| `ai.selectionActions` | `aiSelectionActions` | Selection strip + actions |
| `ai.fineTune` | `aiFineTune` | Inspector-style prop editors |
| `link` | `link` | `<a>` (SPA navigation for `/…`) |
| `badge` | `badge` | ShadCN `Badge` |
| `alert` | `alert` | Bordered alert box |
| `spinner` | `spinner` | Lucide spinner |
| `skeleton` | `skeleton` | ShadCN `Skeleton` placeholder |
| `avatar` | `avatar` | ShadCN `Avatar` (+ fallback) |
| `progress` | `progress` | ShadCN `Progress` (0–100) |
| `separator` | `separator` | ShadCN `Separator` |
| `icon` | `icon` | Lucide kebab-case name (full set; same as nav / `ui.icon`) |
| `tooltip` | `tooltip` | ShadCN `Tooltip` wrapping children |
| `hoverCard` | `hovercard` | ShadCN `HoverCard` wrapping children |
| `popover` | `popover` | ShadCN `Popover` (server-owned `open`) |
| `inputOtp` | `inputotp` | ShadCN `InputOTP` |
| `toggleGroup` | `togglegroup` (+ `toggleitem`) | ShadCN `ToggleGroup` |
| `menubar` | `menubar` (+ `menubarmenu` / `menubarsubmenu` / `menubaritem` / `menubarcheckbox` / `menubarradiogroup` / `menubarradioitem` / `menubarseparator`) | ShadCN `Menubar` (submenu, checkbox, radio) |
| `carousel` | `carousel` (+ `carouselslide`) | Embla carousel |
| `command` | `command` (+ `commandgroup` / `commanditem` / `commandseparator`) | Command palette (`mode: 'dialog' \| 'inline'`; dialog owns `open`) |
| `resizable` | `resizable` (+ `resizablepanel` / `resizablehandle`) | `react-resizable-panels` |
| `scrollArea` | `scrollarea` | ShadCN `ScrollArea` |
| `keybind` | `keybind` | Headless `window` `keydown` chord listener (`return null`) |
| `kbd` | `kbd` | Display-only chord glyphs (`Kbd` / `KbdGroup`; same tokens as `keybind`) |
| `markdown` | `markdown` | Client `marked` + DOMPurify |
| `html` | `html` | Trusted server HTML (`dangerouslySetInnerHTML`) |
| `image` | `image` | `<img>` |
| `upload` | `upload` | File picker / dropzone → `POST /upload` (progress/abort) → WS `upload` / `progress` / `error` / `abort` |
| `stat` | `stat` | Grid of metric cards |
| `areaChart` | `areachart` | Recharts stacked area (+ legend, optional interactive ranges, `stacked?`) |
| `barChart` | `barchart` | Recharts bar (`stacked?`, `layout?: 'vertical' \| 'horizontal'`) |
| `lineChart` | `linechart` | Recharts line (+ optional interactive ranges) |
| `pieChart` | `piechart` | Recharts pie/donut (`nameKey`/`valueKey` or `series`, `innerRadius?`) |
| `radarChart` | `radarchart` | Recharts radar (`angleKey` + `series`, optional `fillOpacity`) |
| `radialChart` | `radialchart` | Recharts radial bar (`nameKey`/`valueKey` or stacked `series`, optional center text / angles) |
| `scatterChart` | `scatterchart` | Recharts scatter (`xKey` / `yKey`, optional `seriesKey`) |
| `composedChart` | `composedchart` | Recharts composed (per-series `type`: bar/line/area) |
| `dataTable` | `datatable` | Search, text/facet filters, views, grouping (collapse all), selection, bulk actions, reorder (coexists with virtualization via windowed drop targets), editors (Enter/Esc + focus restore), export, multi-sort (Shift+click), local or remote (`manualPagination` + `getQuery` / `setLoading` / `withLoading`), density/zebra, column resize/pin, footer aggregates, row virtualization (≥40 body items), loading/empty, actions, detail drawer |
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
| `dialogStack` | `dialogStack` (+ `dialogStackStep`) | Multi-step stacked modal (server-owned `open` + `index`) |
| `alertDialog` | `alertdialog` | Confirm/destructive modal (server-owned `open`) |
| `dropdownMenu` | `dropdownmenu` (+ `dropdownitem` / `dropdownseparator`) | ShadCN dropdown; item `select` events |
| `contextMenu` | `contextmenu` (+ `contextmenuitem` / `contextmenuseparator`) | ShadCN context menu; item `select` events |
| `breadcrumb` | `breadcrumb` | ShadCN breadcrumb; `href` crumbs use SPA `pushState` |
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
| `select` / `slider` / `rating` / `colorPicker` / `tags` / `radioGroup` / `combobox` / `date` / `editor` | `change` (and `input` if bound for radio/combobox/date/editor) |
| `tabs` / `accordion` / `collapsible` | `change` |
| `tree` | `select`, `expand` |
| `kanban` | `cardMove`, `cardSelect`, `cardClick` (`cardMove`/`cardSelect` settle always registered; user `on*` run after owned-model update) |
| `list` | `itemMove`, `itemClick` (`itemMove` settle always registered; user `onItemMove` runs after owned-model update) |
| `imageCrop` | `crop` |
| `gantt` | `itemMove`, `itemClick`, `markerAdd` (`itemMove` / `markerAdd` settle always registered; user `on*` run after owned-model update) |
| `flow` | `connect`, `nodeMove` (drag-stop), `nodesDelete`, `edgesDelete`, `selectionChange` (settle handlers always registered; user `on*` run after owned-model update) |
| `aiChat` / `aiPromptBar` | `submit`, `tabChange`, `followUp`, `action`, `sourceRemove`, `modelChange`, `command`, `dictate`, `change` |
| `aiMessage` | `followUp`, `action` |
| `aiThinking` | `toggle` |
| `aiApproval` | `approve`, `reject` |
| `aiToolChips` / `aiTasks` / `aiContext` | `chipClick`, `taskClick`, `chunkClick` |
| `aiRecommendation` | `accept`, `reject`, `alternative` |
| `aiDiffTable` / `aiInsights` / `aiSelectionActions` / `aiFineTune` | `rowClick`, `indexChange`, `prompt`, `action`, `change` |
| `upload` | `upload`, `progress`, `error`, `abort` |
| `dataTable` | `sort`, `filter`, `columnFilter`, `columnVisibility`, `columnPin`, `export`, `page`, `pageSize`, `action`, `bulkAction`, `reorder`, `selectionChange`, `cellChange`, `viewChange`, `groupToggle`, `primaryAction` |
| `dialog` / `sheet` / `drawer` / `alertDialog` | `close` (`alertDialog` also `confirm`) |
| `dialogStack` | `close`, `indexChange` (number) |
| `dropdownMenu` / `contextMenu` / `menubar` item | `select` |
| `menubar` checkbox | `checkedChange` |
| `menubar` radio group | `valueChange` |
| `popover` / `command` (dialog) | `openChange` |
| `inputOtp` / `toggleGroup` | `change` (`inputOtp` also `complete`) |
| `keybind` | `press` |

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
- `rating`
- `colorPicker`
- `tags`
- `tree` (`selected` / `expanded`)
- `editor`
- `kanban` (`columns` while dragging; `selectedCardId` for drawer; settle patches owned columns — do not wrap board in `ui.auto`)
- `list` (`groups` while dragging; settle patches owned groups — do not wrap list in `ui.auto`)
- `gantt` (`rows` while dragging / resizing / cross-row; markers on create; settle patches owned model — do not wrap chart in `ui.auto`)
- `flow` (node positions while dragging; edges on connect keep the client-generated id through settle; position patches do not remount RF nodes)
- `tabs`
- `accordion`
- `collapsible`
- `datatable` (search / column filter inputs)

Server patches still reconcile when `props.value` changes (e.g. `draft.text = ''` after Add).

Field `error` is **server-owned** (via initial props, `.setError`, or `ui.validate`). It is not optimistic — the client shows `props.error` after `updateProps` patches.

## Styling

Prefer Tailwind utility classes via `.classes(...)`:

```typescript
ui.label('Hello').classes('text-3xl font-bold text-muted-foreground');
```

Layout `gap` uses a small numeric scale mapped to `gap-0` … `gap-8` in the client.

The client ships a light ShadCN-style theme (CSS variables in `packages/client/src/index.css`). Override tokens at runtime with `ui.run({ css: './globals.css' })`.
