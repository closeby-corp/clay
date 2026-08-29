/**
 * Orders-shaped multi-region proof (Phase 1).
 *
 * Nested `ui.auto` for filter / list / detail — the runtime shape that
 * `// @clay-reactive` + `clay --reactive-let` compiles `let` into.
 * Always works with plain `bun run cli` (no loader).
 *
 * Sibling with `let` syntax: `ReactiveLetOrdersLet.ts` (`bun run cli:reactive-let`).
 */
import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Orders (state/auto)',
  icon: 'clipboard-list',
  order: 12,
};

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
      'Master–detail regions with ui.state / ui.auto. Sibling: Orders (let) needs bun run cli:reactive-let.',
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
  });
});
