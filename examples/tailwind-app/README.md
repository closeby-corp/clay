# Clay + Tailwind (zero-config)

Use arbitrary Tailwind utilities in pages — Clay scans and injects CSS automatically.

```bash
cd examples/tailwind-app
bun install
bun run dev          # clay --reload (auto Tailwind watch)
# or
bun run start        # library mode (index.ts)
```

No Tailwind config or CSS build scripts. Output: `.clay/tailwind.css`.

Optional theme tokens: `src/tokens.css` (wired in `_run.ts` / `index.ts`).

See [docs/tailwind.md](../../docs/tailwind.md).
