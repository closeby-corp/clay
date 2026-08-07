import { ui } from '@badui/ui';
import type { KanbanCardMovePayload, KanbanColumn } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Kanban',
  icon: 'columns-3',
  order: 89,
};

const INITIAL: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      { id: 'c1', title: 'Sketch board API', description: 'columns + cardMove payload' },
      { id: 'c2', title: 'Wire BoundKanban', description: 'dnd-kit cross-column' },
    ],
  },
  {
    id: 'doing',
    title: 'Doing',
    cards: [{ id: 'c3', title: 'Demo + docs', description: 'in-memory move handler' }],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [{ id: 'c4', title: 'Phase 1–2 controls', description: 'rating, editor, tree…' }],
  },
];

function applyCardMove(columns: KanbanColumn[], payload: KanbanCardMovePayload): KanbanColumn[] {
  const next = columns.map((col) => ({
    ...col,
    cards: col.cards.map((card) => ({ ...card })),
  }));
  let moved: (typeof next)[0]['cards'][0] | undefined;
  for (const col of next) {
    const idx = col.cards.findIndex((c) => c.id === payload.cardId);
    if (idx >= 0) {
      [moved] = col.cards.splice(idx, 1);
      break;
    }
  }
  if (!moved) return columns;
  const to = next.find((c) => c.id === payload.toColumnId);
  if (!to) return columns;
  const index = Math.max(0, Math.min(payload.index, to.cards.length));
  to.cards.splice(index, 0, moved);
  return next;
}

ui.page('/examples/kanban', () => {
  const board = ui.state({
    columns: INITIAL.map((col) => ({
      ...col,
      cards: col.cards.map((c) => ({ ...c })),
    })),
    lastMove: '' as string,
  });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.kanban — drag cards within/across columns; cardMove once per drop; server columns via updateProps.',
        );

        exampleSection('Board', 'Optimistic local reorder; server state is the source of truth after each drop.');

        ui.auto(() => {
          ui.kanban({
            columns: board.columns,
            onCardMove: (payload) => {
              console.log('onCardMove', payload);
              board.columns = applyCardMove(board.columns, payload);
              board.lastMove = `${payload.cardId}: ${payload.fromColumnId} → ${payload.toColumnId} @ ${payload.index}`;
            },
            onCardClick: (cardId) => {
              ui.notify(`Card ${cardId}`, 'info');
            },
          });
        });

        ui.auto(() => {
          ui.label(board.lastMove ? `Last move: ${board.lastMove}` : 'Last move: —').classes(
            'text-sm text-muted-foreground',
          );
        });

        ui.button('Reset board', {
          variant: 'outline',
          onClick: () => {
            board.columns = INITIAL.map((col) => ({
              ...col,
              cards: col.cards.map((c) => ({ ...c })),
            }));
            board.lastMove = '';
            ui.notify('Board reset', 'info');
          },
        });
      },
      { gap: 6 },
    );
  });
});
