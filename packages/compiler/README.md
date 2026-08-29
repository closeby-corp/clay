# @close-by/clay-compiler

Compile-time transforms for [Clay](https://github.com/closeby-corp/clay).

## Phase 2 MVP: reactive `let`

Rewrites a documented subset of `let` declarations into `ui.state` + `ui.auto`. See [docs/reactive-let.md](../../docs/reactive-let.md).

**Opt-in only:** file pragma or `"use reactive";` — `ui.page` alone does not transform. The `clay` CLI leaves the Bun loader **off** unless you pass `--reactive-let`.

```ts
// @clay-reactive
ui.page('/', () => {
  let count = 0;
  ui.label(`Count: ${count}`);
  ui.button('+', { onClick: () => { count++; } });
});
```

```bash
clay hello.ts --reactive-let
```
