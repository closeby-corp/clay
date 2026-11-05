import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Fill layout',
  icon: 'layout-dashboard',
  order: 11,
  group: 'Start here',
  groupIcon: 'sparkles',
};

const threads = Array.from({ length: 40 }, (_, i) => ({
  from: ['Ada', 'Lin', 'Sam', 'Kai'][i % 4]!,
  subject: [`Q${(i % 4) + 1} planning`, 'Deploy notes', 'Design review', 'Invoice #' + (1040 + i)][i % 4]!,
}));

ui.page('/examples/layout', () => {
  exampleFrame(() => {
    // fillViewport: exactly the visible page height; children with `grow` split what's left.
    ui.column({ fillViewport: true, gap: 4 }, () => {
      exampleHeader(
        undefined,
        'ui.column({ fillViewport }) + grow + scroll — the page never scrolls; the panels do. ui.grid auto-fits the KPI row.',
      );

      ui.grid({ minColWidth: '9rem', gap: 3 }, () => {
        for (const [label, value] of [
          ['Open', '128'],
          ['Assigned', '64'],
          ['Waiting', '17'],
          ['Closed today', '342'],
        ]) {
          ui.card({ gap: 1, className: 'py-4' }, () => {
            ui.label(label!).classes('text-xs text-muted-foreground');
            ui.label(value!).classes('text-2xl font-bold tabular-nums');
          });
        }
      });

      // grow: takes the remaining height; children stretch to it.
      ui.row({ grow: true, gap: 4, wrap: false, className: 'max-md:flex-col' }, () => {
        ui.card({ title: 'Inbox', description: 'scroll: true', scroll: true, gap: 1, className: 'md:w-80 md:shrink-0' }, () => {
          for (const t of threads) {
            ui.row(() => {
              ui.label(t.from).classes('w-10 font-medium');
              ui.label(t.subject).classes('truncate text-muted-foreground');
            }, { gap: 2, wrap: false, minWidthZero: true, className: 'rounded-md px-2 py-1.5 hover:bg-accent' });
          }
        });

        ui.column({ grow: true, gap: 2 }, () => {
          ui.dataTable(threads.map((t, i) => ({ id: i + 1, from: t.from, subject: t.subject })), {
            fill: true,
            searchable: true,
            pageSize: 100,
            columns: [
              { key: 'id', header: '#' },
              { key: 'from', header: 'From', filter: 'facet' },
              { key: 'subject', header: 'Subject' },
            ],
            onRowClick: (row) => ui.notify(`Opened #${row.id}: ${row.subject}`, 'info'),
          });
        });
      });
    });
  });
});
