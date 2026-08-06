import { describe, expect, test } from 'bun:test';
import {
  AutoElement,
  ClientSession,
  Element,
  auto,
  clearPages,
  page,
  reactive,
  setPageWrapper,
  state,
  subscribe,
  trackReads,
  withParent,
} from './index';

describe('state / trackReads', () => {
  test('state is reactive alias', () => {
    const s = state({ n: 1 });
    let hits = 0;
    const deps = trackReads(() => {
      void s.n;
    });
    expect(deps).toHaveLength(1);
    expect(deps[0]!.key).toBe('n');

    subscribe(s, 'n', () => {
      hits++;
    });
    s.n = 2;
    expect(hits).toBe(1);
  });

  test('trackReads ignores reads outside frame', () => {
    const s = reactive({ a: 1, b: 2 });
    void s.a;
    const deps = trackReads(() => {
      void s.b;
    });
    expect(deps.map((d) => d.key)).toEqual(['b']);
  });
});

describe('auto', () => {
  test('rebuilds when tracked state changes', async () => {
    clearPages();
    setPageWrapper(null);
    const s = state({ count: 0 });
    let labels: string[] = [];
    let el!: AutoElement;

    page('/auto', () => {
      el = auto(() => {
        const text = `Count: ${s.count}`;
        labels.push(text);
        new Element('label', { text });
      });
    });

    const patches: unknown[] = [];
    const session = new ClientSession('/auto', (msg) => {
      if (msg.op === 'patch') patches.push(...msg.patches);
    });
    session.mount();

    expect(el).toBeInstanceOf(AutoElement);
    expect(labels).toEqual(['Count: 0']);
    expect(el.children[0]?.props.text).toBe('Count: 0');

    s.count = 1;
    await Promise.resolve();
    await Promise.resolve();

    expect(labels).toEqual(['Count: 0', 'Count: 1']);
    expect(el.children[0]?.props.text).toBe('Count: 1');
    expect(patches.some((p: any) => p.op === 'setChildren')).toBe(true);
  });

  test('does not reset external state on refresh', async () => {
    clearPages();
    setPageWrapper(null);
    const s = state({ count: 5 });
    let rebuilds = 0;

    page('/auto2', () => {
      auto(() => {
        rebuilds++;
        void s.count;
        withParent(new Element('row', {}), () => {
          new Element('label', { text: String(s.count) });
        });
      });
    });

    new ClientSession('/auto2', () => {}).mount();
    expect(rebuilds).toBe(1);
    s.count = 6;
    await Promise.resolve();
    await Promise.resolve();
    expect(rebuilds).toBe(2);
    expect(s.count).toBe(6);
  });
});
