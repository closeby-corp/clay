# Tailwind CSS for Clay apps

Clay auto-builds Tailwind utilities from your page modules. Use `.classes(...)` / `className` freely — no app Tailwind config, no separate CSS build step.

## Zero-config (default)

**CLI** (`clay ./pages` or `clay ./pages --reload`):

- On by default; scans the entry directory
- With `--reload`, rebuilds utilities on file changes
- Opt out: `--no-tailwind`

**Library mode** (`ui.run`):

```typescript
ui.run({
  // default when `pages/`, `src/`, or `app/` exists under cwd
  // tailwind: true,
  // or: tailwind: { content: ['./pages'], watch: true },
});
```

Generated CSS lands in `.clay/tailwind.css` and is injected via `css`. Add `.clay/` to `.gitignore`.

`@close-by/clay` depends on `tailwindcss` and `@tailwindcss/cli` — you do not need to install them yourself.

## What you get

| Need | How |
|------|-----|
| Utilities in pages (`text-[10px]`, `w-[32rem]`, …) | Automatic scan + build |
| Theme tokens (`--primary`, `--background`, …) | Optional extra `css` file (merged after utilities) |
| Disable | `--no-tailwind` / `ui.run({ tailwind: false })` / `CLAY_NO_TAILWIND=1` |

Clay’s shipped client already includes a Tailwind + shadcn **baseline**. Auto Tailwind adds **app-scanned** utilities on top (theme + utilities only — not a second full preflight).

## Token overrides

```css
/* src/tokens.css */
:root {
  --primary: oklch(0.45 0.12 150);
}
```

```typescript
ui.run({
  css: './src/tokens.css', // merged with auto Tailwind output
});
```

## Custom scan roots

```typescript
ui.run({
  tailwind: {
    content: ['./pages', './lib/ui-helpers'],
    watch: true,
    appendCss: '/* optional extra CSS in the Tailwind input */',
  },
});
```

## Manual pipeline (optional)

If you prefer your own Tailwind input/`@source` setup, turn auto off and inject a prebuilt file:

```bash
bunx clay ./pages --no-tailwind
# and ui.run({ tailwind: false, css: './src/globals.generated.css' })
```

See [`examples/tailwind-app/`](../examples/tailwind-app/) for a minimal zero-config app.
