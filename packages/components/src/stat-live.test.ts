import { describe, expect, test } from 'bun:test';
import type { ClientSession } from '@close-by/clay-core';
import { stat, StatElement, type StatItem } from './index';

function fakeSession() {
  const patches: Array<{ op: string; id?: string; props?: Record<string, unknown> }> = [];
  const session = {
    isMounted: true,
    register: () => {},
    unregister: () => {},
    enqueuePatch: (p: (typeof patches)[number]) => patches.push(p),
  } as unknown as ClientSession;
  return { session, patches };
}

const ITEMS: StatItem[] = [
  { title: 'Revenue', value: '$10k', sparkline: { data: [{ t: 1, v: 1 }, { t: 2, v: 2 }], xKey: 't', yKey: 'v' } },
  { title: 'Users', value: 120 },
];

function mounted() {
  const el = stat(ITEMS);
  const { session, patches } = fakeSession();
  el.setSession(session);
  return { el, patches, items: () => el.props.items as StatItem[] };
}

describe('StatElement live updates', () => {
  test('factory returns a StatElement', () => {
    expect(stat(ITEMS)).toBeInstanceOf(StatElement);
    expect(stat(ITEMS).type).toBe('stat');
  });

  test('updateItem by title merges one card and sends items only', () => {
    const { el, patches, items } = mounted();
    el.updateItem('Users', { value: 130, trend: '+8%' });
    expect(items()[1]).toEqual({ title: 'Users', value: 130, trend: '+8%' });
    expect(items()[0]).toEqual(ITEMS[0]!);
    expect(patches).toHaveLength(1);
    expect(Object.keys(patches[0]!.props!)).toEqual(['items']);
    expect(ITEMS[1]!.value).toBe(120); // input not mutated
  });

  test('updateItem by index and unknown card', () => {
    const { el, items } = mounted();
    el.updateItem(0, { value: '$11k' });
    expect(items()[0]!.value).toBe('$11k');
    expect(() => el.updateItem('Nope', {})).toThrow(RangeError);
    expect(() => el.updateItem(5, {})).toThrow(RangeError);
  });

  test('appendSparkline appends and trims to max', () => {
    const { el, items } = mounted();
    el.appendSparkline('Revenue', [{ t: 3, v: 3 }, { t: 4, v: 4 }], { max: 3 });
    expect(items()[0]!.sparkline!.data).toEqual([{ t: 2, v: 2 }, { t: 3, v: 3 }, { t: 4, v: 4 }]);
    expect(items()[0]!.sparkline!.xKey).toBe('t');
    expect(ITEMS[0]!.sparkline!.data).toHaveLength(2);
  });

  test('appendSparkline guards', () => {
    const { el, patches } = mounted();
    el.appendSparkline('Revenue', []);
    expect(patches).toHaveLength(0);
    expect(() => el.appendSparkline('Users', { t: 1, v: 1 })).toThrow(/no sparkline/);
    expect(() => el.appendSparkline('Revenue', { t: 1 }, { max: -1 })).toThrow(RangeError);
  });

  test('setItems replaces all cards', () => {
    const { el, items } = mounted();
    el.setItems([{ title: 'Only', value: 1 }]);
    expect(items()).toEqual([{ title: 'Only', value: 1 }]);
  });
});
