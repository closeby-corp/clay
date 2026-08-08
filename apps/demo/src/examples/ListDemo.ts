import { ui } from '@badui/ui';
import type { ListGroup, ListItemMovePayload } from '@badui/ui';
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

function applyItemMove(groups: ListGroup[], payload: ListItemMovePayload): ListGroup[] {
  const next = groups.map((g) => ({
    ...g,
    items: g.items.map((item) => ({ ...item })),
  }));
  let moved: (typeof next)[0]['items'][0] | undefined;
  for (const g of next) {
    const idx = g.items.findIndex((i) => i.id === payload.itemId);
    if (idx >= 0) {
      [moved] = g.items.splice(idx, 1);
      break;
    }
  }
  if (!moved) return groups;
  const to = next.find((g) => g.id === payload.toGroupId);
  if (!to) return groups;
  const index = Math.max(0, Math.min(payload.index, to.items.length));
  to.items.splice(index, 0, moved);
  return next;
}

ui.page('/examples/list', () => {
  const board = ui.state({
    groups: INITIAL.map((g) => ({
      ...g,
      items: g.items.map((i) => ({ ...i })),
    })),
    lastMove: '' as string,
  });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.list — dense vertical groups with cross-group drag; itemMove once per drop.',
        );

        exampleSection(
          'Grouped list',
          'Optimistic local reorder; server groups are the source of truth after each drop.',
        );

        ui.auto(() => {
          ui.list({
            groups: board.groups,
            onItemMove: (payload) => {
              console.log('onItemMove', payload);
              board.groups = applyItemMove(board.groups, payload);
              board.lastMove = `${payload.itemId}: ${payload.fromGroupId} → ${payload.toGroupId} @ ${payload.index}`;
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

        ui.button('Reset list', {
          variant: 'outline',
          onClick: () => {
            board.groups = INITIAL.map((g) => ({
              ...g,
              items: g.items.map((i) => ({ ...i })),
            }));
            board.lastMove = '';
            ui.notify('List reset', 'info');
          },
        });
      },
      { gap: 6 },
    );
  });
});
