import { ui } from '@badui/ui';
import type { GanttItemMovePayload, GanttRow } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Gantt',
  icon: 'chart-gantt',
  order: 91,
};

const INITIAL: GanttRow[] = [
  {
    id: 'design',
    title: 'Design',
    items: [
      { id: 'd1', title: 'Wireframes', start: '2026-07-20', end: '2026-08-02' },
      { id: 'd2', title: 'UI kit', start: '2026-08-03', end: '2026-08-15' },
    ],
  },
  {
    id: 'build',
    title: 'Build',
    items: [
      { id: 'b1', title: 'BoundGantt', start: '2026-08-01', end: '2026-08-12' },
      { id: 'b2', title: 'Demo + docs', start: '2026-08-10', end: '2026-08-20' },
    ],
  },
  {
    id: 'ship',
    title: 'Ship',
    items: [{ id: 's1', title: 'Release wave two', start: '2026-08-18', end: '2026-08-28' }],
  },
];

function applyItemMove(rows: GanttRow[], payload: GanttItemMovePayload): GanttRow[] {
  return rows.map((row) => ({
    ...row,
    items: row.items.map((item) =>
      item.id === payload.itemId
        ? { ...item, start: payload.start, end: payload.end }
        : { ...item },
    ),
  }));
}

ui.page('/examples/gantt', () => {
  const board = ui.state({
    rows: INITIAL.map((row) => ({
      ...row,
      items: row.items.map((i) => ({ ...i })),
    })),
    readonly: false,
    lastMove: '' as string,
  });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.gantt — sidebar labels, time axis, bars, today + markers; drag move/resize emits itemMove on pointer-up.',
        );

        exampleSection(
          'Project timeline',
          'Optimistic local dates while dragging; server rows are the source of truth after each move.',
        );

        ui.auto(() => {
          ui.gantt({
            rows: board.rows,
            markers: [
              { id: 'beta', date: '2026-08-15', label: 'Beta' },
              { id: 'ga', date: '2026-08-28', label: 'GA' },
            ],
            range: { start: '2026-07-15', end: '2026-09-05' },
            readonly: board.readonly,
            onItemMove: (payload) => {
              console.log('onItemMove', payload);
              board.rows = applyItemMove(board.rows, payload);
              board.lastMove = `${payload.itemId} @ ${payload.rowId}: ${payload.start} → ${payload.end}`;
            },
            onItemClick: (itemId) => {
              ui.notify(`Item ${itemId}`, 'info');
            },
          });
        });

        ui.auto(() => {
          ui.label(board.lastMove ? `Last move: ${board.lastMove}` : 'Last move: —').classes(
            'text-sm text-muted-foreground',
          );
        });

        ui.auto(() => {
          ui.row(
            () => {
              ui.button(board.readonly ? 'Enable drag' : 'Make readonly', {
                variant: 'outline',
                onClick: () => {
                  board.readonly = !board.readonly;
                },
              });
              ui.button('Reset timeline', {
                variant: 'outline',
                onClick: () => {
                  board.rows = INITIAL.map((row) => ({
                    ...row,
                    items: row.items.map((i) => ({ ...i })),
                  }));
                  board.lastMove = '';
                  ui.notify('Timeline reset', 'info');
                },
              });
            },
            { gap: 3 },
          );
        });
      },
      { gap: 6 },
    );
  });
});
