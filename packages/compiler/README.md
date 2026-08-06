# @badui/compiler

Compile-time transforms for [BadUI](https://github.com/tfsoares/bad-ui).

## Phase 2 MVP: reactive `let`

Rewrites a documented subset of top-level `let` declarations into `ui.state` + `ui.auto`. See [docs/reactive-let.md](../../docs/reactive-let.md).

```ts
// @badui-reactive
ui.page('/', () => {
  let count = 0;
  ui.label(`Count: ${count}`);
  ui.button('+', { onClick: () => { count++; } });
});
```

The `badui` CLI registers the Bun loader plugin automatically. Opt out with `--no-reactive-let`.
