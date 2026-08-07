# @badui/cli

`badui` CLI — run a `.ts` file or page directory with **prebuilt** React client assets (`client-dist`).

```bash
bun add @badui/cli @badui/ui
bunx badui hello.ts
# or: badui ./pages --app --title "My App"
```

For a page directory, an optional `_run.ts` (skipped by `loadPages`) may export `configureRun(base)` to merge into the CLI `ui.run` config (auth secrets, role-aware nav, etc.).

Requires [Bun](https://bun.sh/). Docs: [Getting started](https://github.com/tfsoares/bad-ui/blob/main/docs/getting-started.md).
