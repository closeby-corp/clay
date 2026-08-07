# WebSocket protocol

All fields are **camelCase**. Transport: single WebSocket at `/ws`.

## Connection flow

1. Browser loads SPA HTML + `/assets/index.js` + `/assets/index.css`
2. Client opens `ws://host/ws` (or `wss://`)
3. Client sends `{ op: "hello", path: "/examples/todo" }`
4. Server creates `ClientSession`, runs the page builder, replies `{ op: "mount", sessionId, tree }`
5. Interaction continues with `event` ↔ `patch` (plus optional `notify` / `navigate` / `theme`)

On unexpected socket close, the client reconnects with exponential backoff (500ms → 10s) and shows a corner **BadUI** status chip (`reloading` / brief `ready`). A sticky “Disconnected — reconnecting…” toast appears only if the outage lasts longer than ~4s. Matching `app` chrome stays mounted across remounts.
## Client → server

### `hello`

```json
{ "op": "hello", "path": "/examples/counter", "userId": "optional-stable-id", "browserStorage": {}, "clientStorage": {}, "tabStorage": {} }
```

Client connects (or sends another `hello` after navigate on the same socket) and identifies the page. Optional `userId` (from localStorage/cookie) enables `ui.storage.user` unless overridden by `resolveUserId`. Optional `browserStorage` / `clientStorage` / `tabStorage` bags hydrate `ui.storage.browser` / `ui.storage.client` / `ui.storage.tab`.

Sent on connect and after client-side navigation. The React client keeps matching `app` shell chrome mounted across remounts; only inset content is replaced.

### `event`

```json
{ "op": "event", "id": "input_abc", "type": "input", "value": "hello" }
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Element id |
| `type` | `string` | Event name (`click`, `input`, `change`, …) |
| `value` | `unknown` | Optional payload (string, number, boolean, …) |

## Server → client

### `mount`

```json
{
  "op": "mount",
  "sessionId": "session_…",
  "tree": {
    "id": "root_…",
    "type": "root",
    "props": {},
    "children": [ /* ElementNode[] */ ]
  }
}
```

### `patch`

```json
{
  "op": "patch",
  "patches": [
    { "op": "updateProps", "id": "label_1", "props": { "text": "Count: 1" } },
    { "op": "setChildren", "id": "refreshable_1", "children": [ /* … */ ] }
  ]
}
```

### Patch ops

| `op` | Fields | Meaning |
|------|--------|---------|
| `replace` | `id`, `node` | Replace entire subtree at `id` |
| `updateProps` | `id`, `props` | Shallow-merge props |
| `setChildren` | `id`, `children` | Replace children array |
| `remove` | `id` | Remove node from parent |

### `navigate`

```json
{ "op": "navigate", "path": "/examples/todo" }
```

Client updates history (`pushState` + `popstate`) and sends a new `hello` on the same WebSocket. Matching `app` chrome stays mounted on the client; inset content remounts.

### `reconnect`

```json
{ "op": "reconnect" }
```

Client closes the socket and reconnects (picks up updated HttpOnly cookies on the next upgrade). Used after auth cookie changes when a full soft-reconnect is requested without going through `authSession`.

### `authSession`

```json
{ "op": "authSession", "action": "establish", "token": "signed…", "path": "/account" }
```

```json
{ "op": "authSession", "action": "clear", "path": "/login" }
```

Client `POST`s / `DELETE`s `/auth/session` (credentials included), optionally updates the SPA path, then soft-reconnects so the next `hello` sees the cookie. Requires `ui.run({ authSecret })`.

### `notify`

```json
{
  "op": "notify",
  "id": "toast_1",
  "message": "Saved!",
  "type": "success",
  "duration": 2500,
  "position": "bottom-right",
  "description": "Optional secondary line"
}
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `id` | `string` | required (server) | Passed to Sonner as toast id |
| `message` | `string` | | Toast title |
| `type` | `info\|success\|warning\|error` | `info` | Maps to `toast.info` / `success` / `warning` / `error` |
| `duration` | `number` | `2500` | ms; `0` → Sonner `Infinity` (sticky) |
| `position` | `top-left\|top-right\|bottom-left\|bottom-right` | `bottom-right` | Sonner position |
| `description` | `string` | | Optional Sonner description |

Client renders via ShadCN `<Toaster />` + imperative `toast` from `sonner`.

### `dismissNotify`

```json
{ "op": "dismissNotify", "id": "toast_1" }
```

Calls `toast.dismiss(id)` on the client.

### `download`

```json
{
  "op": "download",
  "filename": "data.csv",
  "mime": "text/csv;charset=utf-8",
  "content": "Title,Status\nAlpha,done"
}
```

Client triggers a file download via a temporary Blob URL.

### `clipboard`

```json
{ "op": "clipboard", "content": "Title\tStatus\nAlpha\tdone" }
```

Client writes `content` with `navigator.clipboard.writeText` (shows an error toast on failure).

### `theme`

```json
{ "op": "theme", "theme": "dark" }
```

| Field | Type | Notes |
|-------|------|-------|
| `theme` | `light\|dark\|system` | Applied via next-themes; persisted under `badui-theme` |

Sent by `ui.theme.set(...)`.

### `runJavaScript`

```json
{ "op": "runJavaScript", "code": "console.log('hi')" }
```

Client evaluates the snippet (trusted server-authored code).

### `scroll`

```json
{ "op": "scroll", "target": "window", "top": "bottom", "behavior": "smooth" }
```

```json
{ "op": "scroll", "target": "selector", "selector": "#footer", "block": "start" }
```

### `clientStorage`

```json
{ "op": "clientStorage", "scope": "browser", "action": "set", "key": "theme", "value": "dark" }
```

Updates the client Web Storage bag used by `ui.storage.browser` (`localStorage`), `ui.storage.client` (`sessionStorage`), or `ui.storage.tab` (`sessionStorage`, key `badui-tab-storage`). Write-through keeps the bag warm for the next `hello`.

### `error`

```json
{ "op": "error", "message": "No page registered for /missing" }
```

## Element JSON

```typescript
type ElementNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children: ElementNode[];
};
```

- No functions on the wire
- Interactive nodes include `props.events: string[]`
- Values for forms live in `props.value` (checkboxes use boolean `value`)

## TypeScript types

Shared definitions live in:

- `packages/core/src/protocol.ts`
- `packages/client/src/protocol.ts` (mirror for the browser bundle)
