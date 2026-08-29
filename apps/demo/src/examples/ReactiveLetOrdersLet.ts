// @clay-reactive
/**
 * Orders-shaped proof authored with reactive `let`.
 *
 * Requires the Bun loader:
 *   cd apps/demo && bun run cli:reactive-let
 *
 * Without `--reactive-let`, clicks update locals but the UI will not refresh
 * (silent no-op). Compare with `ReactiveLetOrders.ts` (Phase 1 state/auto).
 */
import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Orders (let)',
  icon: 'clipboard-list',
  order: 13,
};

ui.page('/examples/reactive-let-orders-let', () => {
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
      'Same UI as Orders (state/auto), written with let. Run: bun run cli:reactive-let',
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
        ui.label(`Matching filter: ${filter || '(none)'}`).classes(
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
                const hay = `${row.id} ${row.city}`.toLowerCase();
                if (filter && !hay.includes(filter.toLowerCase())) continue;
                ui.button(`${row.id} · ${row.city}`, {
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
