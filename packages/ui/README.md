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

Docs: [Getting started](https://github.com/closeby-corp/clay/blob/main/docs/getting-started.md).
