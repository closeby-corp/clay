# Browser APIs in Clay pages

Page builders and event handlers run on the **server** (Bun), not in the browser. DOM globals such as `window`, `document`, `navigator`, and `location` are missing or wrong there — using them is a common source of silent no-ops (e.g. URL hash deep-links that never update).

## Do

| Need | Use |
|------|-----|
| Copy text | `ui.clipboard(text)` |
| Read / set URL hash | `ui.getUrlHash()` / `ui.setUrlHash(hash)` |
| Open a URL in a new tab | `ui.openExternal(url)` |
| In-app route change | `ui.navigate(path)` |
| Scroll | `ui.scroll.to` / `ui.scroll.intoView` |
| Escape hatch | `ui.runJavaScript(code)` (trusted snippets only) |

```ts
ui.button('Copy id', {
  onClick: () => {
    ui.clipboard(orderId);
    ui.notify('Copied', 'success');
  },
});

const focus = ui.getUrlHash(); // from last hello / setUrlHash
ui.setUrlHash(traceId);
ui.openExternal('https://signoz.example/trace/' + traceId);
```

`getUrlHash` returns the hash **without** a leading `#`. It is hydrated from the client on each `hello` (connect, reconnect, SPA navigate) and updated when you call `setUrlHash`.

## Don’t

```ts
// Wrong — server has no clipboard / location
await navigator.clipboard.writeText(value);
window.location.hash = traceId;
window.open(url, '_blank');
```

Even with `typeof window !== 'undefined'` guards, page code still runs on the server: those branches never run, so the UI looks fine while deep-links and copy do nothing.

## Related

- Helpers table: [API — dialogs and feedback](./api.md#dialogs-and-feedback)
- Protocol: `clipboard`, `setUrlHash`, `openExternal` in [WebSocket protocol](./protocol.md)
- Phase 1 reactivity (preferred over DOM hacks): [reactive-let](./reactive-let.md)
