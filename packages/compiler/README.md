# @clay/compiler

Compile-time transforms for [Clay](https://github.com/closeby-corp/clay).

## Phase 2 MVP: reactive `let`

Rewrites a documented subset of top-level `let` declarations into `ui.state` + `ui.auto`. See [docs/reactive-let.md](../../docs/reactive-let.md).

```ts
// @clay-reactive
ui.page('/', () => {
  let count = 0;
  ui.label(`Count: ${count}`);
  ui.button('+', { onClick: () => { count++; } });
});
```

The `clay` CLI registers the Bun loader plugin automatically. Opt out with `--no-reactive-let`.
