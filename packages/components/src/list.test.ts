import { describe, expect, test } from 'bun:test';
import { list, ListElement } from './list';

const GROUPS = [
  {
    id: 'inbox',
    title: 'Inbox',
    items: [
      { id: 'i1', title: 'One' },
      { id: 'i2', title: 'Two' },
    ],
  },
  { id: 'done', title: 'Done', items: [{ id: 'i3', title: 'Three' }] },
];

describe('ListElement owned list state', () => {
  test('registers itemMove settle event even without user handlers', () => {
    const el = list({ groups: GROUPS });
    expect(el).toBeInstanceOf(ListElement);
    expect(el.props.events).toEqual(expect.arrayContaining(['itemMove']));
  });

  test('getGroups / setGroups clone owned groups', () => {
    const el = list({ groups: GROUPS });
    const got = el.getGroups();
    expect(got).toEqual(GROUPS);
    got[0]!.items[0]!.title = 'mutated';
    expect(el.getGroups()[0]!.items[0]!.title).toBe('One');

    el.setGroups([{ id: 'solo', title: 'Solo', items: [] }]);
    expect(el.getGroups()).toEqual([{ id: 'solo', title: 'Solo', items: [] }]);
  });

  test('moveItem relocates within and across groups', () => {
    const el = list({ groups: GROUPS });
    el.moveItem({
      itemId: 'i1',
      fromGroupId: 'inbox',
      toGroupId: 'inbox',
      index: 1,
    });
    expect(el.getGroups()[0]!.items.map((i) => i.id)).toEqual(['i2', 'i1']);

    el.moveItem({
      itemId: 'i1',
      fromGroupId: 'inbox',
      toGroupId: 'done',
      index: 0,
    });
    expect(el.getGroups()[0]!.items.map((i) => i.id)).toEqual(['i2']);
    expect(el.getGroups()[1]!.items.map((i) => i.id)).toEqual(['i1', 'i3']);
  });

  test('addItem / removeItem / addGroup / removeGroup', () => {
    const el = list({ groups: GROUPS });
    el.addItem('done', { id: 'i4', title: 'Four' });
    expect(el.getGroups()[1]!.items.map((i) => i.id)).toEqual(['i3', 'i4']);

    el.removeItem('i2');
    expect(el.getGroups()[0]!.items.map((i) => i.id)).toEqual(['i1']);

    el.addGroup({ id: 'later', title: 'Later', items: [] });
    expect(el.getGroups().map((g) => g.id)).toEqual(['inbox', 'done', 'later']);

    el.removeGroup('done');
    expect(el.getGroups().map((g) => g.id)).toEqual(['inbox', 'later']);
  });

  test('default itemMove settle updates owned model then user handlers', async () => {
    const moves: string[] = [];
    const el = list({
      groups: GROUPS,
      onItemMove: (p) => {
        moves.push(`${p.itemId}@${p.toGroupId}:${p.index}`);
      },
    });

    await el.handleEvent('itemMove', {
      itemId: 'i1',
      fromGroupId: 'inbox',
      toGroupId: 'done',
      index: 1,
    });
    expect(el.getGroups()[0]!.items.map((i) => i.id)).toEqual(['i2']);
    expect(el.getGroups()[1]!.items.map((i) => i.id)).toEqual(['i3', 'i1']);
    expect(moves).toEqual(['i1@done:1']);
  });
});
