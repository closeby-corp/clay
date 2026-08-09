import { describe, expect, test } from 'bun:test';
import { Element } from '@badui/core';
import {
  absoluteInsertIndex,
  kanban,
  KanbanElement,
  KANBAN_DETAIL_FIELD,
} from './kanban';

const COLUMNS = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      { id: 'c1', title: 'One', laneId: 'eng' },
      { id: 'c2', title: 'Two', laneId: 'design' },
    ],
  },
  { id: 'done', title: 'Done', cards: [{ id: 'c3', title: 'Three', laneId: 'eng' }] },
];

const LANES = [
  { id: 'eng', title: 'Engineering' },
  { id: 'design', title: 'Design' },
];

describe('KanbanElement owned board state', () => {
  test('registers cardMove and cardSelect settle events even without user handlers', () => {
    const el = kanban({ columns: COLUMNS });
    expect(el).toBeInstanceOf(KanbanElement);
    expect(el.props.events).toEqual(expect.arrayContaining(['cardMove', 'cardSelect']));
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

  test('moveCard updates laneId when swimlanes are set', () => {
    const el = kanban({ columns: COLUMNS, lanes: LANES });
    el.moveCard({
      cardId: 'c1',
      fromColumnId: 'todo',
      toColumnId: 'todo',
      index: 0,
      fromLaneId: 'eng',
      toLaneId: 'design',
    });
    const todo = el.getColumns()[0]!;
    expect(todo.cards.find((c) => c.id === 'c1')!.laneId).toBe('design');
    // Lane-scoped index 0 among design cards → before c2
    expect(todo.cards.map((c) => c.id)).toEqual(['c1', 'c2']);
  });

  test('absoluteInsertIndex places within a lane group', () => {
    const cards = [
      { id: 'a', title: 'A', laneId: 'eng' },
      { id: 'b', title: 'B', laneId: 'design' },
      { id: 'c', title: 'C', laneId: 'eng' },
    ];
    expect(absoluteInsertIndex(cards, 'eng', 0)).toBe(0);
    expect(absoluteInsertIndex(cards, 'eng', 1)).toBe(2);
    expect(absoluteInsertIndex(cards, 'eng', 2)).toBe(3);
    expect(absoluteInsertIndex(cards, 'design', 0)).toBe(1);
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

  test('lanes APIs and removeLane clears card laneId', () => {
    const el = kanban({ columns: COLUMNS, lanes: LANES });
    expect(el.getLanes()).toEqual(LANES);
    el.addLane({ id: 'ops', title: 'Ops' });
    expect(el.getLanes().map((l) => l.id)).toEqual(['eng', 'design', 'ops']);
    el.removeLane('eng');
    expect(el.getLanes().map((l) => l.id)).toEqual(['design', 'ops']);
    expect(el.getColumns()[0]!.cards.find((c) => c.id === 'c1')!.laneId).toBeUndefined();
  });

  test('selectCard / clearSelection own selectedCardId', async () => {
    const selected: Array<string | null> = [];
    const el = kanban({
      columns: COLUMNS,
      onCardSelect: (id) => {
        selected.push(id);
      },
    });
    expect(el.getSelectedCardId()).toBeNull();
    el.selectCard('c1');
    expect(el.getSelectedCardId()).toBe('c1');
    el.selectCard('missing');
    expect(el.getSelectedCardId()).toBeNull();
    el.selectCard('c2');
    el.clearSelection();
    expect(el.getSelectedCardId()).toBeNull();

    await el.handleEvent('cardSelect', 'c3');
    expect(el.getSelectedCardId()).toBe('c3');
    expect(selected).toEqual(['c3']);

    await el.handleEvent('cardSelect', null);
    expect(el.getSelectedCardId()).toBeNull();
    expect(selected).toEqual(['c3', null]);
  });

  test('removeCard clears selection when that card was open', () => {
    const el = kanban({ columns: COLUMNS, selectedCardId: 'c2' });
    expect(el.getSelectedCardId()).toBe('c2');
    el.removeCard('c2');
    expect(el.getSelectedCardId()).toBeNull();
  });

  test('detail stamps __detail on wire columns', () => {
    const el = kanban({
      columns: COLUMNS,
      detail: (card) => {
        new Element('label', { text: `Detail:${card.id}` });
      },
    });
    const wire = el.props.columns as Array<{
      cards: Array<Record<string, unknown>>;
    }>;
    const detail = wire[0]!.cards[0]![KANBAN_DETAIL_FIELD] as { __ui: { type: string } };
    expect(detail?.__ui?.type).toBe('column');
    // Public getter strips wire-only fields
    expect((el.getColumns()[0]!.cards[0] as Record<string, unknown>)[KANBAN_DETAIL_FIELD]).toBeUndefined();
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
