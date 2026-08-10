# @clay/cli

`clay` CLI — run a `.ts` file or page directory with **prebuilt** React client assets (`client-dist`).

```bash
bun add @clay/cli @clay/ui
bunx clay hello.ts
# or: clay ./pages --app --title "My App"
```

For a page directory, an optional `_run.ts` (skipped by `loadPages`) may export `configureRun(base)` to merge into the CLI `ui.run` config (auth secrets, role-aware nav, etc.).

Requires [Bun](https://bun.sh/). Docs: [Getting started](https://github.com/closeby-corp/clay/blob/main/docs/getting-started.md).
