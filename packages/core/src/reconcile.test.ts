import { describe, expect, test } from 'bun:test';
import {
  AutoElement,
  ClientSession,
  Element,
  RefreshableElement,
  auto,
  clearPages,
  page,
  setPageWrapper,
  state,
} from './index';

function setup(path: string, build: () => void) {
  clearPages();
  setPageWrapper(null);
  page(path, build);
  const patches: any[] = [];
  const session = new ClientSession(path, (msg) => {
    if (msg.op === 'patch') patches.push(...msg.patches);
  });
  session.mount();
  return { session, patches };
}

const label = (text: string, key?: string | number) => {
  const el = new Element('label', { text });
  if (key !== undefined) el.key(key);
  return el;
};
const ids = (el: Element) => el.children.map((c) => c.id);
const texts = (el: Element) => el.children.map((c) => c.props.text);

describe('reconcile', () => {
  test('same shape only emits updateProps', () => {
    const data = { t: 'a' };
    let r!: RefreshableElement;
    const { patches, session } = setup('/r1', () => {
      r = new RefreshableElement(() => {
        label(data.t);
      });
    });
    const before = ids(r);
    data.t = 'b';
    r.refresh();
    session.flushPatches();
    expect(ids(r)).toEqual(before);
    expect(patches).toEqual([{ op: 'updateProps', id: before[0], props: { text: 'b' } }]);
  });

  test('append keeps ids, single setChildren', () => {
    const items = ['a', 'b'];
    let r!: RefreshableElement;
    const { patches, session } = setup('/r2', () => {
      r = new RefreshableElement(() => {
        for (const i of items) label(i);
      });
    });
    const before = ids(r);
    items.push('c');
    r.refresh();
    session.flushPatches();
    const after = ids(r);
    expect(after.slice(0, 2)).toEqual(before);
    expect(after).toHaveLength(3);
    const sc = patches.filter((p) => p.op === 'setChildren');
    expect(sc).toHaveLength(1);
    expect(sc[0].id).toBe(r.id);
    expect(sc[0].children.map((c: any) => c.id)).toEqual(after);
    expect(patches.some((p) => p.op === 'replace')).toBe(false);
  });

  test('remove from middle, unkeyed and keyed', () => {
    let items = ['A', 'B', 'C'];
    let r!: RefreshableElement;
    setup('/r3', () => {
      r = new RefreshableElement(() => {
        for (const i of items) label(i);
      });
    });
    let before = ids(r);
    items = ['A', 'C'];
    r.refresh();
    expect(texts(r)).toEqual(['A', 'C']);
    expect(ids(r).filter((i) => before.includes(i))).toHaveLength(2);

    items = ['A', 'B', 'C'];
    let k!: RefreshableElement;
    const { session } = setup('/r3k', () => {
      k = new RefreshableElement(() => {
        for (const i of items) label(i, i);
      });
    });
    before = ids(k);
    items = ['A', 'C'];
    k.refresh();
    expect(ids(k)).toEqual([before[0]!, before[2]!]);
    expect(session.getElement(before[1]!)).toBeUndefined();
  });

  test('keyed reorder preserves ids', () => {
    let items = ['A', 'B', 'C'];
    let r!: RefreshableElement;
    const { patches, session } = setup('/r4', () => {
      r = new RefreshableElement(() => {
        for (const i of items) label(i, i);
      });
    });
    const [a, b, c] = ids(r);
    items = ['C', 'A', 'B'];
    r.refresh();
    session.flushPatches();
    expect(ids(r)).toEqual([c!, a!, b!]);
    expect(texts(r)).toEqual(['C', 'A', 'B']);
    const sc = patches.filter((p) => p.op === 'setChildren');
    expect(sc).toHaveLength(1);
    expect(sc[0].children.map((x: any) => x.id)).toEqual([c, a, b]);
  });

  test('conditional element in the middle', () => {
    const d = { badge: false };
    let r!: RefreshableElement;
    setup('/r5', () => {
      r = new RefreshableElement(() => {
        new Element('label', { text: 'l' });
        if (d.badge) new Element('badge', { text: 'b' });
        new Element('button', { text: 'btn' });
      });
    });
    const [l, btn] = ids(r);
    d.badge = true;
    r.refresh();
    expect(r.children.map((c) => c.type)).toEqual(['label', 'badge', 'button']);
    expect(r.children[0]!.id).toBe(l!);
    expect(r.children[2]!.id).toBe(btn!);
    d.badge = false;
    r.refresh();
    expect(ids(r)).toEqual([l!, btn!]);
  });

  test('type change replaces only that child', () => {
    const d = { t: 'label' };
    let r!: RefreshableElement;
    setup('/r6', () => {
      r = new RefreshableElement(() => {
        new Element('label', { text: 'x' });
        new Element(d.t, { text: 'y' });
        new Element('button', { text: 'z' });
      });
    });
    const before = ids(r);
    d.t = 'badge';
    r.refresh();
    expect(r.children[0]!.id).toBe(before[0]!);
    expect(r.children[1]!.id).not.toBe(before[1]!);
    expect(r.children[1]!.type).toBe('badge');
    expect(r.children[2]!.id).toBe(before[2]!);
  });

  test('reused button gets new handler', async () => {
    const calls: string[] = [];
    let n = 'one';
    let r!: RefreshableElement;
    const { session } = setup('/r7', () => {
      r = new RefreshableElement(() => {
        const v = n;
        new Element('button', { text: v, onClick: () => void calls.push(v) });
      });
    });
    const id = r.children[0]!.id;
    n = 'two';
    r.refresh();
    expect(r.children[0]!.id).toBe(id);
    await session.handleMessage({ op: 'event', id, type: 'click' } as any);
    expect(calls).toEqual(['two']);
  });

  test('nested auto keeps ids and uses new builder', async () => {
    const outer = state({ tab: 'a' });
    const inner = state({ count: 0 });
    let outerAuto!: AutoElement;
    const { patches } = setup('/r8', () => {
      outerAuto = auto(() => {
        const tab = outer.tab;
        auto(() => {
          new Element('label', { text: `${tab}${inner.count}` });
        });
      });
    });
    const innerEl = outerAuto.children[0] as AutoElement;
    const labelId = innerEl.children[0]!.id;
    outer.tab = 'b';
    await Promise.resolve();
    await Promise.resolve();
    expect(outerAuto.children[0]).toBe(innerEl);
    expect(innerEl.children[0]!.id).toBe(labelId);
    expect(innerEl.children[0]!.props.text).toBe('b0');
    expect(patches.some((p) => p.op === 'setChildren')).toBe(false);

    inner.count = 1;
    await Promise.resolve();
    await Promise.resolve();
    expect(innerEl.children[0]!.id).toBe(labelId);
    expect(innerEl.children[0]!.props.text).toBe('b1');
  });

  const tick = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  function nestedSetup(path: string) {
    const outer = state({ tab: 'a' });
    const inner = state({ count: 0 });
    let outerAuto!: AutoElement;
    const handles: AutoElement[] = [];
    let runs = 0;
    const { patches } = setup(path, () => {
      outerAuto = auto(() => {
        const tab = outer.tab;
        const h = auto(() => {
          runs++;
          new Element('label', { text: `${tab}${inner.count}` });
        });
        handles.push(h);
      });
    });
    return { outer, inner, outerAuto, handles, patches, runs: () => runs };
  }

  test('nested auto: dependency change refreshes the surviving instance only', async () => {
    const { outer, inner, outerAuto, patches, runs } = nestedSetup('/r10');
    const survivor = outerAuto.children[0] as AutoElement;
    const id = survivor.id;
    const labelId = survivor.children[0]!.id;
    outer.tab = 'b';
    await tick();
    expect(outerAuto.children[0]).toBe(survivor);
    expect(survivor.id).toBe(id);
    patches.length = 0;
    const before = runs();
    inner.count = 5;
    await tick();
    expect(runs()).toBe(before + 1); // twin is not subscribed: exactly one rebuild
    expect(survivor.children[0]!.id).toBe(labelId);
    expect(survivor.children[0]!.props.text).toBe('b5');
    expect(patches.filter((p) => p.op === 'updateProps' && p.id === labelId).length).toBe(1);
  });

  test('handle captured in new outer run forwards refresh and children', async () => {
    const { outer, outerAuto, handles } = nestedSetup('/r11');
    const survivor = outerAuto.children[0] as AutoElement;
    outer.tab = 'b';
    await tick();
    const twin = handles[handles.length - 1]!;
    expect(twin).not.toBe(survivor);
    expect(twin.children).toBe(survivor.children);
    expect(twin.children[0]!.props.text).toBe('b0');
    twin.refresh();
    expect(survivor.children[0]!.props.text).toBe('b0');
    expect(twin.children).toBe(survivor.children);
  });

  test('repeated outer refreshes do not accumulate subscriptions', async () => {
    const { outer, inner, outerAuto, runs } = nestedSetup('/r12');
    const survivor = outerAuto.children[0] as AutoElement;
    for (const t of ['b', 'c', 'd']) {
      outer.tab = t;
      await tick();
    }
    expect(outerAuto.children[0]).toBe(survivor);
    const before = runs();
    inner.count = 1;
    await tick();
    expect(runs()).toBe(before + 1);
    expect(survivor.children[0]!.props.text).toBe('d1');
  });

  test('destroyed elements are unregistered', async () => {
    let items = ['A', 'B'];
    let r!: RefreshableElement;
    const { session } = setup('/r9', () => {
      r = new RefreshableElement(() => {
        for (const i of items) label(i, i);
      });
    });
    const [a, b] = ids(r);
    items = ['A'];
    r.refresh();
    expect(session.getElement(a!)).toBeDefined();
    expect(session.getElement(b!)).toBeUndefined();
  });
});
