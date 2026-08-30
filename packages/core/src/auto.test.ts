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
    const labelId = el.children[0]!.id;

    s.count = 1;
    await Promise.resolve();
    await Promise.resolve();

    expect(labels).toEqual(['Count: 0', 'Count: 1']);
    expect(el.children[0]?.props.text).toBe('Count: 1');
    expect(el.children[0]?.id).toBe(labelId);
    expect(patches.some((p: any) => p.op === 'updateProps' && p.props?.text === 'Count: 1')).toBe(
      true,
    );
    expect(patches.some((p: any) => p.op === 'setChildren')).toBe(false);
  });

  test('nested auto reuses inner auto on outer-only refresh', async () => {
    clearPages();
    setPageWrapper(null);
    const outer = state({ tab: 'a' });
    const inner = state({ count: 0 });
    let outerAuto!: AutoElement;
    let innerAuto!: AutoElement;

    page('/nested-auto', () => {
      outerAuto = auto(() => {
        void outer.tab;
        innerAuto = auto(() => {
          new Element('label', { text: `c=${inner.count}` });
        });
      });
    });

    const patches: unknown[] = [];
    const session = new ClientSession('/nested-auto', (msg) => {
      if (msg.op === 'patch') patches.push(...msg.patches);
    });
    session.mount();

    const innerId = innerAuto.id;
    const labelId = innerAuto.children[0]!.id;

    outer.tab = 'b';
    await Promise.resolve();
    await Promise.resolve();

    const innerAfterOuter = outerAuto.children[0] as AutoElement;
    expect(innerAfterOuter.id).toBe(innerId);
    expect(innerAfterOuter.children[0]?.id).toBe(labelId);
    expect(patches.some((p: any) => p.op === 'setChildren' && p.id === outerAuto.id)).toBe(
      false,
    );

    patches.length = 0;
    inner.count = 1;
    await Promise.resolve();
    await Promise.resolve();

    expect(innerAfterOuter.children[0]?.props.text).toBe('c=1');
    expect(patches.some((p: any) => p.op === 'updateProps' && p.props?.text === 'c=1')).toBe(
      true,
    );
    expect(patches.some((p: any) => p.op === 'setChildren' && p.id === innerAfterOuter.id)).toBe(
      false,
    );
  });

  test('falls back to setChildren when structure changes', async () => {
    clearPages();
    setPageWrapper(null);
    const s = state({ show: false });
    let el!: AutoElement;

    page('/auto-struct', () => {
      el = auto(() => {
        void s.show;
        new Element('label', { text: 'a' });
        if (s.show) new Element('label', { text: 'b' });
      });
    });

    const patches: unknown[] = [];
    const session = new ClientSession('/auto-struct', (msg) => {
      if (msg.op === 'patch') patches.push(...msg.patches);
    });
    session.mount();
    expect(el.children).toHaveLength(1);

    s.show = true;
    await Promise.resolve();
    await Promise.resolve();

    expect(el.children).toHaveLength(2);
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

  test('clears className when reactive toggle turns off', async () => {
    clearPages();
    setPageWrapper(null);
    const s = state({ mode: 'list' as 'list' | 'grid' });
    let autoEl!: AutoElement;

    page('/auto-class', () => {
      autoEl = auto(() => {
        for (const mode of ['list', 'grid'] as const) {
          new Element('button', {
            text: mode,
            variant: 'outline',
            className: s.mode === mode ? 'bg-accent' : undefined,
          });
        }
      });
    });

    const patches: unknown[] = [];
    const session = new ClientSession('/auto-class', (msg) => {
      if (msg.op === 'patch') patches.push(...msg.patches);
    });
    session.mount();

    const listBtn = autoEl.children[0]!;
    const gridBtn = autoEl.children[1]!;
    expect(listBtn.props.className).toBe('bg-accent');
    expect(gridBtn.props.className).toBeUndefined();

    s.mode = 'grid';
    await Promise.resolve();
    await Promise.resolve();

    expect(listBtn.props.className).toBeUndefined();
    expect(gridBtn.props.className).toBe('bg-accent');
    expect(
      patches.some(
        (p: any) => p.op === 'updateProps' && p.id === listBtn.id && p.props?.className === null,
      ),
    ).toBe(true);
  });
});
