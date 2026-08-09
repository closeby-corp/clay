import { ui } from '@badui/ui';
import type { KanbanColumn, KanbanLane } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Kanban',
  icon: 'columns-3',
  order: 89,
};

const LANES: KanbanLane[] = [
  { id: 'eng', title: 'Engineering' },
  { id: 'design', title: 'Design' },
];

const INITIAL: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      {
        id: 'c1',
        title: 'Sketch board API',
        description: 'columns + cardMove payload',
        laneId: 'eng',
      },
      {
        id: 'c2',
        title: 'Wire BoundKanban',
        description: 'dnd-kit cross-column',
        laneId: 'design',
      },
    ],
  },
  {
    id: 'doing',
    title: 'Doing',
    cards: [
      {
        id: 'c3',
        title: 'Demo + docs',
        description: 'drawer + swimlanes',
        laneId: 'eng',
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      {
        id: 'c4',
        title: 'Phase 1–2 controls',
        description: 'rating, editor, tree…',
        laneId: 'design',
      },
    ],
  },
];

function cloneBoard(): KanbanColumn[] {
  return INITIAL.map((col) => ({
    ...col,
    cards: col.cards.map((c) => ({ ...c })),
  }));
}

ui.page('/examples/kanban', () => {
  const status = ui.state({ lastMove: '' as string, lastSelect: '' as string });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.kanban — board owns columns/lanes/selection; cardMove + cardSelect settle the model (no outer ui.auto remount).',
        );

        exampleSection(
          'Board with swimlanes',
          'Click a card for the detail drawer. Drag across columns and lanes; settle patches owned columns.',
        );

        const board = ui.kanban({
          columns: cloneBoard(),
          lanes: LANES.map((l) => ({ ...l })),
          detail: (card, column) => {
            ui.label(card.title).classes('font-medium');
            if (card.description) {
              ui.label(card.description).classes('text-sm text-muted-foreground');
            }
            ui.label(`Column: ${column.title}`).classes('text-xs text-muted-foreground');
            if (card.laneId) {
              const lane = LANES.find((l) => l.id === card.laneId);
              ui.label(`Lane: ${lane?.title ?? card.laneId}`).classes(
                'text-xs text-muted-foreground',
              );
            }
          },
          onCardMove: (payload) => {
            console.log('onCardMove', payload);
            const laneBit =
              payload.toLaneId != null
                ? ` [${payload.fromLaneId ?? '—'} → ${payload.toLaneId}]`
                : '';
            status.lastMove = `${payload.cardId}: ${payload.fromColumnId} → ${payload.toColumnId} @ ${payload.index}${laneBit}`;
          },
          onCardSelect: (cardId) => {
            status.lastSelect = cardId ?? '';
          },
          onCardClick: (cardId) => {
            console.log('onCardClick', cardId);
          },
        });

        ui.auto(() => {
          ui.label(status.lastMove ? `Last move: ${status.lastMove}` : 'Last move: —').classes(
            'text-sm text-muted-foreground',
          );
          ui.label(
            status.lastSelect ? `Open card: ${status.lastSelect}` : 'Open card: —',
          ).classes('text-sm text-muted-foreground');
        });

        ui.row(
          () => {
            ui.button('Reset board', {
              variant: 'outline',
              onClick: () => {
                board.setColumns(cloneBoard());
                board.setLanes(LANES.map((l) => ({ ...l })));
                board.clearSelection();
                status.lastMove = '';
                status.lastSelect = '';
                ui.notify('Board reset', 'info');
              },
            });
            ui.button('Open first card', {
              variant: 'outline',
              onClick: () => {
                board.selectCard('c1');
              },
            });
          },
          { gap: 2 },
        );
      },
      { gap: 6 },
    );
  });
});
