# Sample app: tasks

A short walkthrough with the `clay` CLI: a tasks list, then two pages and a sidebar. Needs [Bun](https://bun.sh/) 1.1+.

You will use a default export (the CLI registers `/` and starts the server), `bindValue` for the input, and `ui.refreshable` when the list changes.

**Alternative:** for a counter-style app without manual `.refresh()`, see [reactive `let`](./reactive-let.md#happy-path-let--clay-reactive) (`// @clay-reactive` + `clay --reactive-let`). This tutorial teaches Phase 1 explicitly so the update model stays visible.

## 1. Create a project

```bash
mkdir clay-tasks && cd clay-tasks
bun init -y
bun add @close-by/clay-cli @close-by/clay
```

In this Clay checkout, skip `bun add` and use `bun run clay …` after `bun run build:client`.

## 2. A page the CLI can run

Create `tasks.ts`. Export a **default function** — `clay` mounts it at `/`.

```typescript
// tasks.ts
import { ui } from '@close-by/clay';

export default function () {
  ui.label('Tasks').classes('text-2xl font-semibold');
  ui.label('Add items in the next step.').classes('text-sm text-muted-foreground');
}
```

```bash
bunx clay tasks.ts --reload --title Tasks
```

The browser should open on http://localhost:3000. Leave `--reload` on so later saves restart the server.

## 3. Capture input

`reactive` + `bindValue` keep the field in sync. `let` in the page builder is **per browser tab**.

```typescript
import { ui, reactive } from '@close-by/clay';

export default function () {
  const draft = reactive({ text: '' });

  ui.label('Tasks').classes('text-2xl font-semibold');

  ui.row(() => {
    ui.input({ placeholder: 'What needs doing?' }).classes('flex-1').bindValue(draft, 'text');
    ui.button('Add', {
      onClick: () => {
        const text = draft.text.trim();
        if (!text) return;
        ui.notify(`Would add: ${text}`, 'success');
        draft.text = '';
      },
    });
  }, { gap: 2 });
}
```

Save, wait for the reload, type a line, click **Add**. You should get a toast.

## 4. Render the list

`setText` / `setValue` update an existing node. When rows appear or disappear, wrap that region in `ui.refreshable` and call `.refresh()`.

```typescript
import { ui, reactive } from '@close-by/clay';

type Task = { id: string; text: string; done: boolean };

export default function () {
  const tasks: Task[] = [];
  const draft = reactive({ text: '' });
  let list: ReturnType<typeof ui.refreshable>;

  ui.label('Tasks').classes('text-2xl font-semibold');

  ui.row(() => {
    ui.input({ placeholder: 'What needs doing?' }).classes('flex-1').bindValue(draft, 'text');
    ui.button('Add', {
      onClick: () => {
        const text = draft.text.trim();
        if (!text) return;
        tasks.push({ id: String(Date.now()), text, done: false });
        draft.text = '';
        list.refresh();
      },
    });
  }, { gap: 2 });

  list = ui.refreshable(() => {
    if (tasks.length === 0) {
      ui.label('Nothing yet.').classes('text-sm text-muted-foreground');
      return;
    }
    ui.column(() => {
      for (const task of tasks) {
        ui.label(task.text);
      }
    }, { gap: 2 });
  });
}
```

Add a couple of items. The list should grow without a full page reload.

## 5. Toggle and delete

Replace the `ui.label(task.text)` loop body with a checkbox and a delete button:

```typescript
        ui.row(() => {
          ui.checkbox({
            checked: task.done,
            label: task.text,
            onChange: (checked) => {
              task.done = Boolean(checked);
              list.refresh();
            },
          }).classes(task.done ? 'flex-1 line-through opacity-60' : 'flex-1');
          ui.button('Delete', {
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              const i = tasks.indexOf(task);
              if (i >= 0) tasks.splice(i, 1);
              list.refresh();
            },
          });
        }, { gap: 2 }).classes('items-center');
```

Handlers run on the **server**. Clay patches the client.

## 6. Two pages and a shell

Directory mode does **not** pick up default exports. Each file calls `ui.page` and may export `pageMeta` for the sidebar.

```typescript
// pages/tasks.ts
import { ui, reactive } from '@close-by/clay';

export const pageMeta = { label: 'Tasks', icon: 'list-todo', order: 10 };

type Task = { id: string; text: string; done: boolean };

ui.page('/', () => {
  const tasks: Task[] = [];
  const draft = reactive({ text: '' });
  let list: ReturnType<typeof ui.refreshable>;

  ui.label('Tasks').classes('text-2xl font-semibold');

  ui.row(() => {
    ui.input({ placeholder: 'What needs doing?' }).classes('flex-1').bindValue(draft, 'text');
    ui.button('Add', {
      onClick: () => {
        const text = draft.text.trim();
        if (!text) return;
        tasks.push({ id: String(Date.now()), text, done: false });
        draft.text = '';
        list.refresh();
      },
    });
  }, { gap: 2 });

  list = ui.refreshable(() => {
    if (tasks.length === 0) {
      ui.label('Nothing yet.').classes('text-sm text-muted-foreground');
      return;
    }
    ui.column(() => {
      for (const task of tasks) {
        ui.row(() => {
          ui.checkbox({
            checked: task.done,
            label: task.text,
            onChange: (checked) => {
              task.done = Boolean(checked);
              list.refresh();
            },
          }).classes(task.done ? 'flex-1 line-through opacity-60' : 'flex-1');
          ui.button('Delete', {
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              const i = tasks.indexOf(task);
              if (i >= 0) tasks.splice(i, 1);
              list.refresh();
            },
          });
        }, { gap: 2 }).classes('items-center');
      }
    }, { gap: 2 });
  });
});
```

```typescript
// pages/about.ts
import { ui } from '@close-by/clay';

export const pageMeta = { label: 'About', icon: 'info', order: 20 };

ui.page('/about', () => {
  ui.label('About').classes('text-2xl font-semibold');
  ui.label('This page is a TypeScript module. The CLI discovered it and put it in the nav.');
});
```

```bash
bunx clay ./pages --app --title Tasks --reload
```

`--app` wraps every page in a dashboard shell. Nav comes from `pageMeta` (`label`, `icon`, `order`).

## What you used

| Piece | Role |
|-------|------|
| `clay` CLI | Run a file or a page directory; ships the React client |
| Default export | Single-file `/` (file mode only) |
| `ui.page` + `pageMeta` | Routes and sidebar (directory mode) |
| `reactive` / `bindValue` | Input without manual `setValue` |
| `ui.refreshable` | Rebuild a list when items change (simple panels) |
| `ui.state` / `ui.auto` / `ui.timer` | Preferred for async / live / multi-region UIs — see [Concepts](./concepts.md#canonical-recipe-state--auto--timer) |
| `let` in the builder | Per-tab state (not shared across users) |

Next: [Concepts](./concepts.md), [API reference](./api.md), or the [demo catalog](./examples.md).
