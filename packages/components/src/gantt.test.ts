import { describe, expect, test } from 'bun:test';
import { gantt, GanttElement } from './gantt';

const ROWS = [
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
    items: [{ id: 'b1', title: 'BoundGantt', start: '2026-08-01', end: '2026-08-12' }],
  },
];

describe('GanttElement owned timeline state', () => {
  test('registers itemMove settle event even without user handlers', () => {
    const el = gantt({ rows: ROWS });
    expect(el).toBeInstanceOf(GanttElement);
    expect(el.props.events).toEqual(expect.arrayContaining(['itemMove']));
  });

  test('getRows / setRows clone owned rows', () => {
    const el = gantt({ rows: ROWS });
    const got = el.getRows();
    expect(got).toEqual(ROWS);
    got[0]!.items[0]!.title = 'mutated';
    expect(el.getRows()[0]!.items[0]!.title).toBe('Wireframes');

    el.setRows([{ id: 'solo', title: 'Solo', items: [] }]);
    expect(el.getRows()).toEqual([{ id: 'solo', title: 'Solo', items: [] }]);
  });

  test('moveItem updates dates and can change row', () => {
    const el = gantt({ rows: ROWS });
    el.moveItem({
      itemId: 'd1',
      rowId: 'design',
      start: '2026-07-22',
      end: '2026-08-05',
    });
    expect(el.getRows()[0]!.items[0]).toMatchObject({
      id: 'd1',
      start: '2026-07-22',
      end: '2026-08-05',
    });

    el.moveItem({
      itemId: 'd1',
      rowId: 'build',
      start: '2026-07-22',
      end: '2026-08-05',
    });
    expect(el.getRows()[0]!.items.map((i) => i.id)).toEqual(['d2']);
    expect(el.getRows()[1]!.items.map((i) => i.id)).toEqual(['b1', 'd1']);
  });

  test('markers / range / readonly helpers', () => {
    const el = gantt({
      rows: ROWS,
      markers: [{ id: 'm1', date: '2026-08-15', label: 'Beta' }],
      range: { start: '2026-07-01', end: '2026-09-01' },
    });
    expect(el.getMarkers()).toEqual([{ id: 'm1', date: '2026-08-15', label: 'Beta' }]);
    expect(el.getRange()).toEqual({ start: '2026-07-01', end: '2026-09-01' });

    el.setMarkers([{ id: 'm2', date: '2026-08-28' }]);
    expect(el.getMarkers()).toEqual([{ id: 'm2', date: '2026-08-28' }]);

    el.setRange({ start: '2026-08-01', end: '2026-08-31' });
    expect(el.getRange()).toEqual({ start: '2026-08-01', end: '2026-08-31' });

    expect(el.isReadonly()).toBe(false);
    el.setReadonly(true);
    expect(el.isReadonly()).toBe(true);
  });

  test('addItem / removeItem / addRow / removeRow', () => {
    const el = gantt({ rows: ROWS });
    el.addItem('build', {
      id: 'b2',
      title: 'Docs',
      start: '2026-08-10',
      end: '2026-08-20',
    });
    expect(el.getRows()[1]!.items.map((i) => i.id)).toEqual(['b1', 'b2']);

    el.removeItem('d2');
    expect(el.getRows()[0]!.items.map((i) => i.id)).toEqual(['d1']);

    el.addRow({ id: 'ship', title: 'Ship', items: [] });
    expect(el.getRows().map((r) => r.id)).toEqual(['design', 'build', 'ship']);

    el.removeRow('build');
    expect(el.getRows().map((r) => r.id)).toEqual(['design', 'ship']);
  });

  test('default itemMove settle updates owned model then user handlers', async () => {
    const moves: string[] = [];
    const el = gantt({
      rows: ROWS,
      onItemMove: (p) => {
        moves.push(`${p.itemId}:${p.start}->${p.end}`);
      },
    });

    await el.handleEvent('itemMove', {
      itemId: 'd1',
      rowId: 'design',
      start: '2026-07-25',
      end: '2026-08-08',
    });
    expect(el.getRows()[0]!.items[0]).toMatchObject({
      start: '2026-07-25',
      end: '2026-08-08',
    });
    expect(moves).toEqual(['d1:2026-07-25->2026-08-08']);
  });
});
