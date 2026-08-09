import { ui } from '@badui/ui';
import type { KanbanColumn } from '@badui/ui';
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
    cards: [{ id: 'c3', title: 'Demo + docs', description: 'element-owned move handler' }],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [{ id: 'c4', title: 'Phase 1–2 controls', description: 'rating, editor, tree…' }],
  },
];

ui.page('/examples/kanban', () => {
  const status = ui.state({ lastMove: '' as string });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.kanban — board owns columns/card order; cardMove settles the model (no outer ui.auto remount).',
        );

        exampleSection(
          'Board',
          'Optimistic local reorder while dragging; settle patches owned columns. Prefer side effects in onCardMove.',
        );

        const board = ui.kanban({
          columns: INITIAL.map((col) => ({
            ...col,
            cards: col.cards.map((c) => ({ ...c })),
          })),
          onCardMove: (payload) => {
            console.log('onCardMove', payload);
            status.lastMove = `${payload.cardId}: ${payload.fromColumnId} → ${payload.toColumnId} @ ${payload.index}`;
          },
          onCardClick: (cardId) => {
            ui.notify(`Card ${cardId}`, 'info');
          },
        });

        ui.auto(() => {
          ui.label(status.lastMove ? `Last move: ${status.lastMove}` : 'Last move: —').classes(
            'text-sm text-muted-foreground',
          );
        });

        ui.button('Reset board', {
          variant: 'outline',
          onClick: () => {
            board.setColumns(
              INITIAL.map((col) => ({
                ...col,
                cards: col.cards.map((c) => ({ ...c })),
              })),
            );
            status.lastMove = '';
            ui.notify('Board reset', 'info');
          },
        });
      },
      { gap: 6 },
    );
  });
});
