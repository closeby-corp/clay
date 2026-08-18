import { ui } from '@close-by/clay';
import type { ListGroup } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'List',
  icon: 'clipboard-list',
  order: 90,
};

const INITIAL: ListGroup[] = [
  {
    id: 'inbox',
    title: 'Inbox',
    items: [
      { id: 'i1', title: 'Review PR', description: 'Wave two list wiring' },
      { id: 'i2', title: 'Write docs', description: 'api + elements' },
    ],
  },
  {
    id: 'doing',
    title: 'Doing',
    items: [{ id: 'i3', title: 'BoundList DnD', description: 'dense vertical groups' }],
  },
  {
    id: 'done',
    title: 'Done',
    items: [{ id: 'i4', title: 'Kanban board', description: 'already shipped' }],
  },
];

ui.page('/examples/list', () => {
  const status = ui.state({ lastMove: '' as string });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.list — list owns groups/item order; itemMove settles the model (no outer ui.auto remount).',
        );

        exampleSection(
          'Grouped list',
          'Optimistic local reorder while dragging; settle patches owned groups. Prefer side effects in onItemMove.',
        );

        const board = ui.list({
          groups: INITIAL.map((g) => ({
            ...g,
            items: g.items.map((i) => ({ ...i })),
          })),
          onItemMove: (payload) => {
            console.log('onItemMove', payload);
            status.lastMove = `${payload.itemId}: ${payload.fromGroupId} → ${payload.toGroupId} @ ${payload.index}`;
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

        ui.button('Reset list', {
          variant: 'outline',
          onClick: () => {
            board.setGroups(
              INITIAL.map((g) => ({
                ...g,
                items: g.items.map((i) => ({ ...i })),
              })),
            );
            status.lastMove = '';
            ui.notify('List reset', 'info');
          },
        });
      },
      { gap: 6 },
    );
  });
});
