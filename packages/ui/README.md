# @close-by/clay

NiceGUI-like `ui.*` facade for [Clay](https://github.com/closeby-corp/clay) apps.

```bash
bun add @close-by/clay-cli @close-by/clay
```

```typescript
import { ui } from '@close-by/clay';

export default function () {
  ui.label('Hello Clay');
}
```

```bash
bunx clay hello.ts
```

Docs: shipped with the package at `node_modules/@close-by/clay/docs/`. See [getting-started.md](docs/getting-started.md) after install.
