import { ui } from '@close-by/clay';
import type { GanttRow } from '@close-by/clay';
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

const INITIAL_DEPS = [
  { id: 'dep-d1-d2', from: 'd1', to: 'd2' },
  { id: 'dep-d2-b1', from: 'd2', to: 'b1' },
  { id: 'dep-b2-s1', from: 'b2', to: 's1' },
];

const INITIAL_MARKERS = [
  { id: 'beta', date: '2026-08-15', label: 'Beta' },
  { id: 'ga', date: '2026-08-28', label: 'GA' },
];

ui.page('/examples/gantt', () => {
  const status = ui.state({ lastMove: '' as string, lastMarker: '' as string });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.gantt — owns rows/dates/markers/deps; itemMove + markerAdd settle the model (no outer ui.auto remount).',
        );

        exampleSection(
          'Project timeline',
          'Drag bars across rows; dependency arrows link finish→start. Double-click the month header to drop a marker, or use the buttons below.',
        );

        const timeline = ui.gantt({
          rows: INITIAL.map((row) => ({
            ...row,
            items: row.items.map((i) => ({ ...i })),
          })),
          markers: INITIAL_MARKERS.map((m) => ({ ...m })),
          dependencies: INITIAL_DEPS.map((d) => ({ ...d })),
          range: { start: '2026-07-15', end: '2026-09-05' },
          onItemMove: (payload) => {
            console.log('onItemMove', payload);
            status.lastMove = `${payload.itemId} @ ${payload.rowId}: ${payload.start} → ${payload.end}`;
          },
          onItemClick: (itemId) => {
            ui.notify(`Item ${itemId}`, 'info');
          },
          onMarkerAdd: (marker) => {
            status.lastMarker = `${marker.label ?? marker.id} @ ${marker.date}`;
            ui.notify(`Marker ${marker.label ?? marker.id}`, 'info');
          },
        });

        ui.auto(() => {
          ui.label(status.lastMove ? `Last move: ${status.lastMove}` : 'Last move: —').classes(
            'text-sm text-muted-foreground',
          );
          ui.label(
            status.lastMarker ? `Last marker: ${status.lastMarker}` : 'Last marker: —',
          ).classes('text-sm text-muted-foreground');
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
            ui.button('Add marker (API)', {
              variant: 'outline',
              onClick: () => {
                const id = `api-${Date.now()}`;
                timeline.addMarker({
                  id,
                  date: '2026-08-22',
                  label: 'API',
                });
                status.lastMarker = `API @ 2026-08-22`;
                ui.notify('Marker added via addMarker', 'info');
              },
            });
            ui.button('Clear markers', {
              variant: 'outline',
              onClick: () => {
                timeline.setMarkers([]);
                status.lastMarker = '';
                ui.notify('Markers cleared', 'info');
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
                timeline.setMarkers(INITIAL_MARKERS.map((m) => ({ ...m })));
                timeline.setDependencies(INITIAL_DEPS.map((d) => ({ ...d })));
                status.lastMove = '';
                status.lastMarker = '';
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
