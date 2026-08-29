# Clay + Tailwind v4 example

Minimal app showing scanned Tailwind utilities injected via `ui.run({ css })`.

```bash
cd examples/tailwind-app
bun install
bun run dev          # Tailwind watch + clay --reload
# or
bun run start        # library mode (index.ts)
```

See [docs/tailwind.md](../../docs/tailwind.md) and [docs/boot.md](../../docs/boot.md).

Add to `.gitignore`:

```
src/globals.generated.css
.clay-reload
```
