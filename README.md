# Clay

Write the UI in TypeScript on the server. Clay renders it in the browser as a React + ShadCN app. You do not write React for screens.

Inspired by [NiceGUI](https://nicegui.io/): imperative `ui.*` calls, per-tab sessions, patches over WebSocket.

The usual way to run an app is the **`clay` CLI** — a file or a folder of pages, no Vite app of your own.

**Docs:** [docs/README.md](./docs/README.md) · **Agents:** [llms.txt](./llms.txt)

## What you can build

`clay hello.ts` or `clay ./pages --app` is a running app. From there:

- **Pages and shell** — routes, sidebar nav from `pageMeta`, optional dashboard chrome (`--app`)
- **Forms** — inputs, validation, `ui.draft` that survives reconnect
- **Data** — DataTable (sort, filter, grouping, remote paging), charts, DuckDB / ClickHouse / Kibana helpers
- **Auth** — signed cookies, roles, login limiter, audit log
- **Files and state** — upload/download, clipboard, `ui.storage` (tab / user / app)
- **Richer widgets** — dialogs, sheets, kanban, gantt, flow diagrams, editor, markdown, AI visual primitives (no model runtime)

Public APIs are camelCase (`onClick`, `bindValue`, `setText`).

## Hello, via `clay`

Prefer a default export. The CLI registers it as `/` and starts the server (opens the browser).

```typescript
// hello.ts
import { ui } from '@close-by/clay';

export default function () {
  let count = 0;
  const label = ui.label(`Count: ${count}`);

  ui.row(() => {
    ui.button('-', {
      onClick: () => {
        count--;
        label.setText(`Count: ${count}`);
      },
    });
    ui.button('+', {
      onClick: () => {
        count++;
        label.setText(`Count: ${count}`);
      },
    });
  });
}
```

```bash
bun add @close-by/clay-cli @close-by/clay
bunx clay hello.ts          # http://localhost:3000
```

A folder of pages (each file calls `ui.page` or exports default) plus a dashboard shell:

```bash
bunx clay ./pages --app --title "My App"
```

| Flag | Meaning |
|------|---------|
| `-p, --port` | Port (default `3000`) |
| `-t, --title` | HTML / shell title |
| `--app` | Shell + nav from discovered `pageMeta` |
| `--reload` | Restart on file changes |
| `--no-open` | Do not open the browser |

`ui.page(...)` without `ui.run` is the same idea — the CLI starts the server. `ui.run()` still works if you want to boot it yourself (library mode). More in [Getting started](./docs/getting-started.md).

## Sample app

A tasks list in six steps: input, `refreshable` list, then two pages with a sidebar. Full walkthrough: [docs/tutorial.md](./docs/tutorial.md).

**1. Project**

```bash
mkdir clay-tasks && cd clay-tasks
bun init -y
bun add @close-by/clay-cli @close-by/clay
```

**2. Page the CLI can run** — default export becomes `/`.

```typescript
// tasks.ts
import { ui } from '@close-by/clay';

export default function () {
  ui.label('Tasks').classes('text-2xl font-semibold');
}
```

**3. Run it** (leave `--reload` on while you edit):

```bash
bunx clay tasks.ts --reload --title Tasks
```

**4. Input** — `reactive` + `bindValue`. **5. List** — wrap changing rows in `ui.refreshable` and call `.refresh()` (not `setText`). **6. Shell** — `ui.page` + `pageMeta` in a folder, then `bunx clay ./pages --app --reload`.

Copy-paste for steps 4–5:

```typescript
// tasks.ts
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
}
```

Two pages and nav: [tutorial step 6](./docs/tutorial.md#6-two-pages-and-a-shell).

## Try it in this repo

Needs [Bun](https://bun.sh/) 1.1+. Build the client once (copied into the workspace CLI), then use `clay` the same way:

```bash
bun install
bun run build:client
bun run clay hello.ts              # http://localhost:3000
bun run clay ./pages --app         # multi-page shell + nav
```

To browse the catalog (counter, todo, dashboard, auth, charts, kanban, …):

```bash
bun run demo                       # http://localhost:4000
# or the same examples through the CLI:
bun run demo:cli
```

## How it works

```
clay hello.ts  /  clay ./pages --app
  → per-tab element tree on the server
  → WebSocket: hello / mount / patch / event
  → React client (shipped with the CLI) → ShadCN
```

You mutate elements (`setText`, `refreshable`, bindings). Clay sends patches. The client is a renderer, not your app. The CLI ships that client prebuilt — no Vite step after `bun add`.

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting started](./docs/getting-started.md) | Install, CLI, first app |
| [Sample app](./docs/tutorial.md) | Step-by-step tasks list |
| [Concepts](./docs/concepts.md) | Sessions, elements, refreshable, bindings |
| [API reference](./docs/api.md) | `ui.*` and Element |
| [Elements](./docs/elements.md) | Wire types and client mapping |
| [Examples](./docs/examples.md) | Demo routes and patterns |
| [Architecture](./docs/architecture.md) | Packages and data flow |
| [WebSocket protocol](./docs/protocol.md) | Message formats |
| [AI UI](./docs/ai.md) | `ui.ai.*` primitives |
| [DuckDB](./docs/duckdb.md) / [ClickHouse](./docs/clickhouse.md) / [Kibana](./docs/kibana.md) | Data clients |

## Packages

| Package | Role |
|---------|------|
| `@close-by/clay-cli` | **`clay` binary** — how you run a file or page directory |
| `@close-by/clay` | App-facing `ui` facade (what you import) |
| `@close-by/clay-core` | Element tree, session, reactive, protocol, storage |
| `@close-by/clay-components` | Element factories |
| `@close-by/clay-server` | Bun HTTP + WebSocket |
| `@close-by/clay-client` | React + ShadCN renderer (private; build is copied into the CLI) |
| `@close-by/clay-auth` | Password hash, login limiter, guards, audit |
| `@close-by/clay-compiler` | Optional compile-time reactive `let` |
| `@close-by/clay-persistence-file` / `@close-by/clay-persistence-redis` | Storage adapters |
| `@close-by/clay-duckdb` / `@close-by/clay-clickhouse` / `@close-by/clay-kibana` | Data clients |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run build:client` | Build the React client (+ copy into `@close-by/clay-cli`) |
| `bun run clay …` | Workspace `clay` CLI |
| `bun run demo` | Demo server at :4000 |
| `bun run demo:cli` | Same examples via `clay … --app` |
| `bun run dev` | Build client, then demo |
| `bun test` | Package tests |
| `bun run pack:publishable` | Pack runtime packages into `dist-pack/` |
| `bun run publish:dry` / `publish:npm` | Validate / publish (maintainers) |

Publish order and pack details: [Getting started](./docs/getting-started.md#publishing-to-npm-maintainers).

## License

MIT. The root workspace is private; runtime packages (`@close-by/clay-cli`, `@close-by/clay`, …) are publishable. `@close-by/clay-client` stays private — its build ships inside `@close-by/clay-cli`.
