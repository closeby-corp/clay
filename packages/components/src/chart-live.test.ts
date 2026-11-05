import { describe, expect, test } from 'bun:test';
import type { ClientSession } from '@close-by/clay-core';
import { ChartElement } from './chart-shared';
import { areaChart } from './area-chart';
import { barChart } from './bar-chart';
import { lineChart } from './line-chart';
import { composedChart } from './composed-chart';
import { pieChart } from './pie-chart';
import { radarChart } from './radar-chart';
import { radialChart } from './radial-chart';
import { scatterChart } from './scatter-chart';
import { sparkline } from './sparkline';

function fakeSession() {
  const patches: Array<{ op: string; id?: string; props?: Record<string, unknown> }> = [];
  const session = {
    isMounted: true,
    register: () => {},
    unregister: () => {},
    enqueuePatch: (p: (typeof patches)[number]) => { patches.push(p); },
  } as unknown as ClientSession;
  return { session, patches };
}

function mounted(data: Record<string, unknown>[] = [{ x: 1 }]) {
  const el = lineChart({ data, xKey: 'x', series: [] });
  const { session, patches } = fakeSession();
  el.setSession(session);
  return { el, session, patches };
}

describe('ChartElement live updates', () => {
  test('append sends only new rows and trims retained data', () => {
    const { el, patches } = mounted([{ x: 1 }, { x: 2 }]);
    expect(el.appendData({ x: 3 }, { max: 2 })).toBe(el);
    expect(el.props.data).toEqual([{ x: 2 }, { x: 3 }]);
    expect(patches as unknown[]).toEqual([{ op: 'appendRows', id: el.id, prop: 'data', rows: [{ x: 3 }], max: 2 }]);
    el.appendData({ x: 4 }, { max: 0 });
    expect(el.props.data).toEqual([]);
  });

  test('append arrays includes every row and omits undefined max', () => {
    const { el, patches } = mounted();
    el.appendData([{ x: 2 }, { x: 3 }]);
    expect(el.props.data).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(patches as unknown[]).toEqual([{ op: 'appendRows', id: el.id, prop: 'data', rows: [{ x: 2 }, { x: 3 }] }]);
  });

  test('empty append is a no-op', () => {
    const { el, patches } = mounted();
    const data = el.props.data;
    expect(el.appendData([])).toBe(el);
    expect(el.props.data).toBe(data);
    expect(patches as unknown[]).toEqual([]);
  });

  test('invalid limits throw before modifying data', () => {
    const { el, patches } = mounted();
    const data = el.props.data;
    for (const max of [-1, 1.5, NaN]) {
      expect(() => el.appendData({ x: 2 }, { max })).toThrow(RangeError);
      expect(() => el.upsertData({ x: 1 }, { max })).toThrow(RangeError);
    }
    expect(el.props.data).toBe(data);
    expect(patches as unknown[]).toEqual([]);
  });

  test('upsert replaces matching rows with full data and appends new keys', () => {
    const { el, patches } = mounted([{ x: 1 }, { x: 2 }]);
    const original = el.props.data;
    expect(el.upsertData({ x: 1, value: 5 })).toBe(el);
    expect(el.props.data).not.toBe(original);
    expect(original).toEqual([{ x: 1 }, { x: 2 }]);
    expect(patches as unknown[]).toEqual([{ op: 'updateProps', id: el.id, props: { data: [{ x: 1, value: 5 }, { x: 2 }] } }]);
    el.upsertData({ x: 3 });
    expect(patches[1] as unknown).toEqual({ op: 'appendRows', id: el.id, prop: 'data', rows: [{ x: 3 }] });
  });

  test('upsert respects pie nameKey, explicit keys, fallback x and max', () => {
    const pie = pieChart({ data: [{ name: 'A', value: 1 }], nameKey: 'name', valueKey: 'value' });
    pie.upsertData({ name: 'A', value: 2 });
    expect(pie.props.data).toEqual([{ name: 'A', value: 2 }]);
    pie.upsertData({ name: 'B', value: 2 }, { key: 'value', max: 0 });
    expect(pie.props.data).toEqual([]);
    const el = new ChartElement('linechart', { data: [{ x: 1 }] });
    el.upsertData({ x: 1, value: 2 });
    expect(el.props.data).toEqual([{ x: 1, value: 2 }]);
  });

  test('unmounted append updates local state without sending patches', () => {
    const { el, session, patches } = mounted();
    session.isMounted = false;
    el.appendData({ x: 2 });
    expect(el.props.data).toEqual([{ x: 1 }, { x: 2 }]);
    expect(patches as unknown[]).toEqual([]);
  });

  for (const events of [undefined, ['click']]) {
    test(`setters send only their key with events=${String(events)}`, () => {
      const { el, patches } = mounted();
      if (events) el.props.events = events;
      const data = [{ x: 2 }];
      const series = [{ key: 'value', label: 'Value' }];
      const headline = { value: 42 };
      expect(el.setData(data)).toBe(el);
      expect(el.props.data).not.toBe(data);
      expect(el.setSeries(series)).toBe(el);
      expect(el.props.series).not.toBe(series);
      expect(el.setHeadline(headline)).toBe(el);
      expect(el.setHeadline(undefined)).toBe(el);
      expect(el.setTitle('Title')).toBe(el);
      expect(el.setDescription('Description')).toBe(el);
      expect(el.setLoading(true)).toBe(el);
      const updates = [{ data }, { series }, { headline }, { headline: null }, { title: 'Title' }, { description: 'Description' }, { loading: true }];
      expect(patches as unknown[]).toEqual(updates.map((props) => ({
        op: 'updateProps', id: el.id, props: { ...props, ...(events ? { events } : {}) },
      })));
    });
  }

  test('all chart factories retain their original type and return ChartElement', () => {
    const cartesian = { data: [], xKey: 'x', series: [] };
    const charts = [
      [areaChart(cartesian), 'areachart'],
      [barChart(cartesian), 'barchart'],
      [lineChart(cartesian), 'linechart'],
      [composedChart(cartesian), 'composedchart'],
      [pieChart({ data: [], nameKey: 'name', valueKey: 'value' }), 'piechart'],
      [radarChart({ data: [], angleKey: 'angle', series: [] }), 'radarchart'],
      [radialChart({ data: [], nameKey: 'name', valueKey: 'value' }), 'radialchart'],
      [scatterChart({ data: [], xKey: 'x', yKey: 'y' }), 'scatterchart'],
      [sparkline({ data: [], xKey: 'x', yKey: 'y' }), 'sparkline'],
    ] as const;
    for (const [el, type] of charts) {
      expect(el).toBeInstanceOf(ChartElement);
      expect(el.type).toBe(type);
    }
  });
});
