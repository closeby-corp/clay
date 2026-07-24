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
| `select` | `select` | Native `<select>` |
| `slider` | `slider` | Native range input |
| `link` | `link` | `<a>` (SPA navigation for `/…`) |
| `badge` | `badge` | ShadCN `Badge` |
| `alert` | `alert` | Bordered alert box |
| `stat` | `stat` | Grid of metric cards |
| `dataTable` | `datatable` | HTML table |
| `row` | `row` | Flex row |
| `column` | `column` | Flex column |
| `container` | `container` | Max-width wrapper |
| `hero` | `hero` | Centered hero |
| `card` | `card` | ShadCN `Card` |
| `refreshable` | `refreshable` | Fragment-like wrapper (`contents`) |
| *(internal)* | `root` | Page root padding |

## Events exposed to the client

Handlers stay on the server. Serialized props include `events: string[]` so the client knows what to emit.

| Element | Typical events |
|---------|----------------|
| `button` | `click` |
| `input` / `textarea` | `input`, `change` |
| `checkbox` | `change` (and `input` if bound) |
| `select` / `slider` | `change` |

Prop names use camelCase (`onClick` → event name `click`).

## Optimistic controls

These types keep **local optimistic state** on the client so interaction is not blocked on the WebSocket round-trip:

- `input`
- `textarea`
- `checkbox`
- `select`
- `slider`

Server patches still reconcile when `props.value` changes (e.g. `draft.text = ''` after Add).

## Styling

Prefer Tailwind utility classes via `.classes(...)`:

```typescript
ui.label('Hello').classes('text-3xl font-bold text-muted-foreground');
```

Layout `gap` uses a small numeric scale mapped to `gap-0` … `gap-8` in the client.

The client ships a light ShadCN-style theme (CSS variables in `packages/client/src/index.css`).
