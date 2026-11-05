import { describe, expect, test } from 'bun:test';
import { ClientSession, RefreshableElement, clearPages, page, setPageWrapper } from '@close-by/clay-core';
import { dataTable, type DataTableElement } from './data-table';
import { map, type MapElement } from './map';

/**
 * Regression: elements rebuilt inside a refreshable/auto block used to keep the old
 * instance and borrow the fresh one's handlers, which were bound to the discarded
 * copy. Their updates went to an id the client had never seen.
 */

const ROWS = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
  { id: 3, name: 'Gamma' },
];

type Patch = { op: string; id?: string; props?: Record<string, unknown> };

function mountWith(build: () => void) {
  clearPages();
  setPageWrapper(null);
  let block!: RefreshableElement;
  page('/rebuild', () => {
    block = new RefreshableElement(build);
  });
  const patches: Patch[] = [];
  const session = new ClientSession('/rebuild', (msg) => {
    if (msg.op === 'patch') patches.push(...(msg.patches as Patch[]));
  });
  session.mount();
  return { session, patches, block: () => block };
}

describe('rebuild inside a refreshable keeps elements live', () => {
  test('data table search after a refresh patches the on-screen table', async () => {
    let table!: DataTableElement;
    const { session, patches, block } = mountWith(() => {
      table = dataTable(ROWS);
    });
    const onScreenId = table.id;

    block().refresh();
    session.flushPatches();
    expect(table.id).toBe(onScreenId);
    expect(session.getElement(onScreenId)).toBe(table);
    patches.length = 0;

    await session.handleMessage({ op: 'event', id: onScreenId, type: 'filter', value: 'bet' } as never);

    const updates = patches.filter((p) => p.op === 'updateProps');
    expect(updates.length).toBeGreaterThan(0);
    expect(updates.every((p) => p.id === onScreenId)).toBe(true);
  });

  test('a reference saved during the rebuild updates the on-screen table', () => {
    let table!: DataTableElement;
    const { session, patches, block } = mountWith(() => {
      table = dataTable(ROWS);
    });
    const onScreenId = table.id;

    block().refresh();
    session.flushPatches();
    patches.length = 0;

    table.setRows([{ id: 9, name: 'Zeta' }]);
    session.flushPatches();

    const updates = patches.filter((p) => p.op === 'updateProps');
    expect(updates.length).toBeGreaterThan(0);
    expect(updates.every((p) => p.id === onScreenId)).toBe(true);
  });

  test('refresh does not remount the table', () => {
    let table!: DataTableElement;
    const { session, patches, block } = mountWith(() => {
      table = dataTable(ROWS);
    });
    patches.length = 0;
    block().refresh();
    session.flushPatches();
    expect(patches.some((p) => p.op === 'setChildren' || p.op === 'replace')).toBe(false);
    expect(table.id).toBeDefined();
  });

  test('map marker drag after a refresh updates the live map', async () => {
    let m!: MapElement;
    const { session, block } = mountWith(() => {
      m = map({ markers: [{ id: 'a', lngLat: [0, 0], draggable: true }] });
    });
    const onScreenId = m.id;

    block().refresh();
    await session.handleMessage({
      op: 'event',
      id: onScreenId,
      type: 'markerDragEnd',
      value: { id: 'a', lngLat: [5, 6] },
    } as never);

    expect(m.id).toBe(onScreenId);
    expect((m.props.markers as { lngLat: number[] }[])[0]!.lngLat).toEqual([5, 6]);
  });
});
