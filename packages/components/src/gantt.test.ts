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
  test('registers itemMove and markerAdd settle events even without user handlers', () => {
    const el = gantt({ rows: ROWS });
    expect(el).toBeInstanceOf(GanttElement);
    expect(el.props.events).toEqual(
      expect.arrayContaining(['itemMove', 'markerAdd']),
    );
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

    el.addMarker({ id: 'm3', date: '2026-08-20', label: 'RC' });
    expect(el.getMarkers().map((m) => m.id)).toEqual(['m2', 'm3']);
    el.addMarker({ id: 'm3', date: '2026-08-21' });
    expect(el.getMarkers()).toHaveLength(2);

    el.removeMarker('m2');
    expect(el.getMarkers()).toEqual([{ id: 'm3', date: '2026-08-20', label: 'RC' }]);

    el.setRange({ start: '2026-08-01', end: '2026-08-31' });
    expect(el.getRange()).toEqual({ start: '2026-08-01', end: '2026-08-31' });

    expect(el.isReadonly()).toBe(false);
    el.setReadonly(true);
    expect(el.isReadonly()).toBe(true);
  });

  test('dependencies helpers and cleanup on remove', () => {
    const el = gantt({
      rows: ROWS,
      dependencies: [
        { id: 'dep1', from: 'd1', to: 'd2' },
        { id: 'dep2', from: 'd2', to: 'b1' },
      ],
    });
    expect(el.getDependencies()).toEqual([
      { id: 'dep1', from: 'd1', to: 'd2' },
      { id: 'dep2', from: 'd2', to: 'b1' },
    ]);

    el.addDependency({ id: 'dep3', from: 'd1', to: 'b1' });
    expect(el.getDependencies().map((d) => d.id)).toEqual(['dep1', 'dep2', 'dep3']);
    el.addDependency({ id: 'dep3', from: 'd1', to: 'b1' });
    el.addDependency({ id: 'self', from: 'd1', to: 'd1' });
    expect(el.getDependencies()).toHaveLength(3);

    el.removeDependency('dep1');
    expect(el.getDependencies().map((d) => d.id)).toEqual(['dep2', 'dep3']);

    el.removeItem('d2');
    expect(el.getDependencies().map((d) => d.id)).toEqual(['dep3']);

    el.setDependencies([{ id: 'x', from: 'd1', to: 'b1' }]);
    el.removeRow('design');
    expect(el.getDependencies()).toEqual([]);
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
        moves.push(`${p.itemId}:${p.rowId}:${p.start}->${p.end}`);
      },
    });

    await el.handleEvent('itemMove', {
      itemId: 'd1',
      rowId: 'build',
      start: '2026-07-25',
      end: '2026-08-08',
    });
    expect(el.getRows()[0]!.items.map((i) => i.id)).toEqual(['d2']);
    expect(el.getRows()[1]!.items.find((i) => i.id === 'd1')).toMatchObject({
      start: '2026-07-25',
      end: '2026-08-08',
    });
    expect(moves).toEqual(['d1:build:2026-07-25->2026-08-08']);
  });

  test('default markerAdd settle updates owned markers then user handlers', async () => {
    const added: string[] = [];
    const el = gantt({
      rows: ROWS,
      onMarkerAdd: (m) => {
        added.push(`${m.id}:${m.date}`);
      },
    });

    await el.handleEvent('markerAdd', {
      id: 'm-new',
      date: '2026-08-20',
      label: 'RC',
    });
    expect(el.getMarkers()).toEqual([
      { id: 'm-new', date: '2026-08-20', label: 'RC' },
    ]);
    expect(added).toEqual(['m-new:2026-08-20']);
  });
});
