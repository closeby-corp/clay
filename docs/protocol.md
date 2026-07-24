# WebSocket protocol

All fields are **camelCase**. Transport: single WebSocket at `/ws`.

## Connection flow

1. Browser loads SPA HTML + `/assets/index.js` + `/assets/index.css`
2. Client opens `ws://host/ws` (or `wss://`)
3. Client sends `{ op: "hello", path: "/examples/todo" }`
4. Server creates `ClientSession`, runs the page builder, replies `{ op: "mount", sessionId, tree }`
5. Interaction continues with `event` ↔ `patch` (plus optional `notify` / `navigate`)

## Client → server

### `hello`

```json
{ "op": "hello", "path": "/examples/counter" }
```

Sent on connect and after client-side navigation.

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

Client updates history and sends a new `hello`.

### `notify`

```json
{ "op": "notify", "message": "Saved!", "type": "success" }
```

`type`: `info` | `success` | `warning` | `error`

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
