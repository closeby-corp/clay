import { describe, expect, test } from 'bun:test';
import { kanban, KanbanElement } from './kanban';

const COLUMNS = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      { id: 'c1', title: 'One' },
      { id: 'c2', title: 'Two' },
    ],
  },
  { id: 'done', title: 'Done', cards: [{ id: 'c3', title: 'Three' }] },
];

describe('KanbanElement owned board state', () => {
  test('registers cardMove settle event even without user handlers', () => {
    const el = kanban({ columns: COLUMNS });
    expect(el).toBeInstanceOf(KanbanElement);
    expect(el.props.events).toEqual(expect.arrayContaining(['cardMove']));
  });

  test('getColumns / setColumns clone owned columns', () => {
    const el = kanban({ columns: COLUMNS });
    const got = el.getColumns();
    expect(got).toEqual(COLUMNS);
    got[0]!.cards[0]!.title = 'mutated';
    expect(el.getColumns()[0]!.cards[0]!.title).toBe('One');

    el.setColumns([{ id: 'solo', title: 'Solo', cards: [] }]);
    expect(el.getColumns()).toEqual([{ id: 'solo', title: 'Solo', cards: [] }]);
  });

  test('moveCard relocates within and across columns', () => {
    const el = kanban({ columns: COLUMNS });
    el.moveCard({
      cardId: 'c1',
      fromColumnId: 'todo',
      toColumnId: 'todo',
      index: 1,
    });
    expect(el.getColumns()[0]!.cards.map((c) => c.id)).toEqual(['c2', 'c1']);

    el.moveCard({
      cardId: 'c1',
      fromColumnId: 'todo',
      toColumnId: 'done',
      index: 0,
    });
    expect(el.getColumns()[0]!.cards.map((c) => c.id)).toEqual(['c2']);
    expect(el.getColumns()[1]!.cards.map((c) => c.id)).toEqual(['c1', 'c3']);
  });

  test('addCard / removeCard / addColumn / removeColumn', () => {
    const el = kanban({ columns: COLUMNS });
    el.addCard('done', { id: 'c4', title: 'Four' });
    expect(el.getColumns()[1]!.cards.map((c) => c.id)).toEqual(['c3', 'c4']);

    el.removeCard('c2');
    expect(el.getColumns()[0]!.cards.map((c) => c.id)).toEqual(['c1']);

    el.addColumn({ id: 'review', title: 'Review', cards: [] });
    expect(el.getColumns().map((c) => c.id)).toEqual(['todo', 'done', 'review']);

    el.removeColumn('done');
    expect(el.getColumns().map((c) => c.id)).toEqual(['todo', 'review']);
  });

  test('default cardMove settle updates owned model then user handlers', async () => {
    const moves: string[] = [];
    const el = kanban({
      columns: COLUMNS,
      onCardMove: (p) => {
        moves.push(`${p.cardId}@${p.toColumnId}:${p.index}`);
      },
    });

    await el.handleEvent('cardMove', {
      cardId: 'c1',
      fromColumnId: 'todo',
      toColumnId: 'done',
      index: 1,
    });
    expect(el.getColumns()[0]!.cards.map((c) => c.id)).toEqual(['c2']);
    expect(el.getColumns()[1]!.cards.map((c) => c.id)).toEqual(['c3', 'c1']);
    expect(moves).toEqual(['c1@done:1']);
  });
});
