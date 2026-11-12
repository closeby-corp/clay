/**
 * Orders-shaped multi-region proof (Phase 1).
 *
 * Nested `ui.auto` for filter / list / detail — the runtime shape that
 * `// @clay-reactive` + `clay --reactive-let` compiles `let` into.
 * Always works with plain `bun run cli` (no loader).
 *
 * Runnable let source: examples/reactive-let-orders.ts (Clay CLI transform).
 */
import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Orders',
  icon: 'clipboard-list',
  order: 20,
  group: 'Reactivity',
  groupIcon: 'zap',
};

const REACTIVE_LET_SOURCE = `// @clay-reactive
import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../apps/demo/src/chrome';

ui.page('/examples/reactive-let-orders', () => {
  let filter = '';
  let selectedId = '';
  let rows = [
    { id: 'ord-1001', status: 'ok', city: 'Lisbon' },
    { id: 'ord-1002', status: 'warn', city: 'Porto' },
    { id: 'ord-1003', status: 'error', city: 'Faro' },
    { id: 'ord-1004', status: 'ok', city: 'Braga' },
  ];

  exampleFrame(() => {
    exampleHeader(
      undefined,
      'The Orders UI, written with let. Run with the Clay CLI (\`clay\`) to enable the let transform.',
    );

    ui.column({ gap: 4, className: 'w-full' }, () => {
      ui.label('Orders').classes('text-lg font-semibold');

      ui.row({ gap: 2, className: 'items-center' }, () => {
        ui.input({
          value: filter,
          placeholder: 'Filter by id or city…',
          className: 'max-w-sm',
          onInput: (v) => {
            filter = v;
          },
        });
        ui.label(\`Matching filter: \${filter || '(none)'}\`).classes(
          'text-sm text-muted-foreground',
        );
      });

      ui.resizable(
        {
          orientation: 'horizontal',
          className: 'h-[28rem] w-full min-h-[20rem] rounded-md border',
        },
        (r) => {
          r.panel({ defaultSize: 42, minSize: 28 }, () => {
            ui.column({ gap: 1, className: 'h-full overflow-auto p-2' }, () => {
              ui.label('Intake').classes('text-xs font-medium text-muted-foreground px-1');
              for (const row of rows) {
                const hay = \`\${row.id} \${row.city}\`.toLowerCase();
                if (filter && !hay.includes(filter.toLowerCase())) continue;
                ui.button(\`\${row.id} · \${row.city}\`, {
                  variant: row.id === selectedId ? 'secondary' : 'ghost',
                  className: 'w-full justify-start',
                  onClick: () => {
                    selectedId = row.id;
                  },
                });
              }
            });
          });

          r.panel({ defaultSize: 58, minSize: 36 }, () => {
            ui.column({ gap: 3, className: 'h-full overflow-auto p-4' }, () => {
              const row = rows.find((x) => x.id === selectedId);
              if (!row) {
                ui.label('Select an order').classes('text-sm text-muted-foreground');
                return;
              }
              ui.label(row.id).classes('text-xl font-semibold tabular-nums');
              ui.badge(row.status, {
                size: 'xs',
                color: row.status === 'ok' ? 'emerald' : row.status === 'warn' ? 'amber' : 'red',
              });
              ui.label(row.city).classes('text-sm');
              ui.button('Clear selection', {
                variant: 'outline',
                size: 'sm',
                onClick: () => {
                  selectedId = '';
                },
              });
            });
          });
        },
      );
    });
  });
});
`;

ui.page('/examples/reactive-let-orders', () => {
  const live = ui.state({
    filter: '',
    selectedId: '',
    rows: [
      { id: 'ord-1001', status: 'ok', city: 'Lisbon' },
      { id: 'ord-1002', status: 'warn', city: 'Porto' },
      { id: 'ord-1003', status: 'error', city: 'Faro' },
      { id: 'ord-1004', status: 'ok', city: 'Braga' },
    ],
  });

  exampleFrame(() => {
    exampleHeader(
      undefined,
      'Browse and filter orders with ui.state / ui.auto; compare the reactive let source below.',
    );

    ui.column({ gap: 4, className: 'w-full' }, () => {
      ui.label('Orders').classes('text-lg font-semibold');

      ui.row({ gap: 2, className: 'items-center' }, () => {
        ui.auto(() => {
          ui.input({
            value: live.filter,
            placeholder: 'Filter by id or city…',
            className: 'max-w-sm',
            onInput: (v) => {
              live.filter = v;
            },
          });
        });
        ui.label(() => `Matching filter: ${live.filter || '(none)'}`).classes(
          'text-sm text-muted-foreground',
        );
      });

      ui.resizable(
        {
          orientation: 'horizontal',
          className: 'h-[28rem] w-full min-h-[20rem] rounded-md border',
        },
        (r) => {
          r.panel({ defaultSize: 42, minSize: 28 }, () => {
            ui.column({ gap: 1, className: 'h-full overflow-auto p-2' }, () => {
              ui.label('Intake').classes('text-xs font-medium text-muted-foreground px-1');
              ui.auto(() => {
                for (const row of live.rows) {
                  const hay = `${row.id} ${row.city}`.toLowerCase();
                  if (live.filter && !hay.includes(live.filter.toLowerCase())) continue;
                  ui.button(`${row.id} · ${row.city}`, {
                    variant: row.id === live.selectedId ? 'secondary' : 'ghost',
                    className: 'w-full justify-start',
                    onClick: () => {
                      live.selectedId = row.id;
                    },
                  });
                }
              });
            });
          });

          r.panel({ defaultSize: 58, minSize: 36 }, () => {
            ui.column({ gap: 3, className: 'h-full overflow-auto p-4' }, () => {
              ui.auto(() => {
                const row = live.rows.find((x) => x.id === live.selectedId);
                if (!row) {
                  ui.label('Select an order').classes('text-sm text-muted-foreground');
                  return;
                }
                ui.label(row.id).classes('text-xl font-semibold tabular-nums');
                ui.badge(row.status, {
                  size: 'xs',
                  color: row.status === 'ok' ? 'emerald' : row.status === 'warn' ? 'amber' : 'red',
                });
                ui.label(row.city).classes('text-sm');
                ui.button('Clear selection', {
                  variant: 'outline',
                  size: 'sm',
                  onClick: () => {
                    live.selectedId = '';
                  },
                });
              });
            });
          });
        },
      );
    });

    exampleSection(
      'Reactive let source',
      'The Clay CLI rewrites reactive let variables into the state/auto form used above. Run: bun run clay examples/reactive-let-orders.ts --reactive-let',
    );
    ui.codeBlock({ code: REACTIVE_LET_SOURCE, language: 'ts', showCopy: true });
  });
});
