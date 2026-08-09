import { ui } from '@badui/ui';
import type { GanttRow } from '@badui/ui';
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

ui.page('/examples/gantt', () => {
  const status = ui.state({ lastMove: '' as string });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.gantt — timeline owns rows/item dates; itemMove settles the model (no outer ui.auto remount).',
        );

        exampleSection(
          'Project timeline',
          'Optimistic local dates while dragging; settle patches owned rows. Prefer side effects in onItemMove.',
        );

        const timeline = ui.gantt({
          rows: INITIAL.map((row) => ({
            ...row,
            items: row.items.map((i) => ({ ...i })),
          })),
          markers: [
            { id: 'beta', date: '2026-08-15', label: 'Beta' },
            { id: 'ga', date: '2026-08-28', label: 'GA' },
          ],
          range: { start: '2026-07-15', end: '2026-09-05' },
          onItemMove: (payload) => {
            console.log('onItemMove', payload);
            status.lastMove = `${payload.itemId} @ ${payload.rowId}: ${payload.start} → ${payload.end}`;
          },
          onItemClick: (itemId) => {
            ui.notify(`Item ${itemId}`, 'info');
          },
        });

        ui.auto(() => {
          ui.label(status.lastMove ? `Last move: ${status.lastMove}` : 'Last move: —').classes(
            'text-sm text-muted-foreground',
          );
        });

        ui.row(
          () => {
            ui.button('Toggle readonly', {
              variant: 'outline',
              onClick: () => {
                timeline.setReadonly(!timeline.isReadonly());
                ui.notify(
                  timeline.isReadonly() ? 'Readonly' : 'Drag enabled',
                  'info',
                );
              },
            });
            ui.button('Reset timeline', {
              variant: 'outline',
              onClick: () => {
                timeline.setRows(
                  INITIAL.map((row) => ({
                    ...row,
                    items: row.items.map((i) => ({ ...i })),
                  })),
                );
                status.lastMove = '';
                ui.notify('Timeline reset', 'info');
              },
            });
          },
          { gap: 3 },
        );
      },
      { gap: 6 },
    );
  });
});
