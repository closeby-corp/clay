import { describe, expect, spyOn, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { diffRowKeys, useRowChangeFlash } from './rowChanges';

const keyOf = (row: Record<string, unknown>) => String(row.id);

describe('diffRowKeys', () => {
  test('first render (prev null) reports nothing as changed', () => {
    const rows = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    const { changed, snapshot } = diffRowKeys(null, rows, keyOf);
    expect(changed.size).toBe(0);
    expect([...snapshot.keys()]).toEqual(['1', '2']);
  });

  test('changed value is flagged', () => {
    const first = diffRowKeys(null, [{ id: 1, name: 'a' }, { id: 2, name: 'b' }], keyOf);
    const { changed } = diffRowKeys(first.snapshot, [{ id: 1, name: 'a' }, { id: 2, name: 'B' }], keyOf);
    expect([...changed]).toEqual(['2']);
  });

  test('unchanged rows are not flagged', () => {
    const first = diffRowKeys(null, [{ id: 1, name: 'a' }], keyOf);
    const { changed } = diffRowKeys(first.snapshot, [{ id: 1, name: 'a' }], keyOf);
    expect(changed.size).toBe(0);
  });

  test('new row is flagged and removed rows are ignored', () => {
    const first = diffRowKeys(null, [{ id: 1, name: 'a' }, { id: 2, name: 'b' }], keyOf);
    const { changed, snapshot } = diffRowKeys(first.snapshot, [{ id: 1, name: 'a' }, { id: 3, name: 'c' }], keyOf);
    expect([...changed]).toEqual(['3']);
    expect([...snapshot.keys()]).toEqual(['1', '3']);
  });

  test('changes to __ internal fields are ignored', () => {
    const first = diffRowKeys(null, [{ id: 1, name: 'a', __cells: [1] }], keyOf);
    const { changed } = diffRowKeys(first.snapshot, [{ id: 1, name: 'a', __cells: [2], __detail: 'x' }], keyOf);
    expect(changed.size).toBe(0);
  });

  test('key order differences are not flagged', () => {
    const first = diffRowKeys(null, [{ id: 1, name: 'a', age: 3 }], keyOf);
    const { changed } = diffRowKeys(first.snapshot, [{ age: 3, name: 'a', id: 1 }], keyOf);
    expect(changed.size).toBe(0);
  });
});

test('flashes expire independently during continuous updates and repeated changes alternate classes', async () => {
  const window = new Window();
  const globals = { window, document: window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  let now = 0;
  let timerId = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const clock = spyOn(Date, 'now').mockImplementation(() => now);
  const schedule = spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void, delay = 0) => {
    timers.set(++timerId, { at: now + delay, callback });
    return timerId;
  }) as typeof setTimeout);
  const cancel = spyOn(globalThis, 'clearTimeout').mockImplementation(((id: number) => {
    timers.delete(id);
  }) as typeof clearTimeout);
  let rows = [{ id: 1, value: 0 }, { id: 2, value: 0 }];
  let enabled = true;
  let flashClass: ReturnType<typeof useRowChangeFlash>;
  function App() {
    flashClass = useRowChangeFlash(rows, keyOf, enabled);
    return null;
  }
  const root = createRoot(window.document.createElement('div') as unknown as HTMLElement);
  const render = () => act(async () => { root.render(createElement(App)); });
  const advance = async (time: number) => {
    now = time;
    await act(async () => {
      for (const [id, timer] of timers) {
        if (timer.at <= now) {
          timers.delete(id);
          timer.callback();
        }
      }
    });
  };
  try {
    await render();
    expect(flashClass!('1')).toBeUndefined();
    rows = [{ id: 1, value: 1 }, { id: 2, value: 0 }];
    await render();
    expect(flashClass!('1')).toBe('clay-row-flash-a');
    await advance(250);
    rows = [{ id: 1, value: 2 }, { id: 2, value: 1 }];
    await render();
    expect(flashClass!('1')).toBe('clay-row-flash-b');
    for (let time = 500; time <= 1750; time += 250) {
      await advance(time);
      rows = [rows[0]!, { id: 2, value: time }];
      await render();
    }
    await advance(1850);
    expect(flashClass!('1')).toBeUndefined();
    expect(flashClass!('2')).toBeDefined();
    await advance(3350);
    expect(flashClass!('2')).toBeUndefined();
    expect(timers.size).toBe(0);

    rows = [{ id: 1, value: 3 }, rows[1]!];
    await render();
    expect(timers.size).toBe(1);
    enabled = false;
    await render();
    expect(flashClass!('1')).toBeUndefined();
    expect(timers.size).toBe(0);
    enabled = true;
    await render();
    expect(flashClass!('1')).toBeUndefined();
    rows = [{ id: 1, value: 4 }, rows[1]!];
    await render();
    expect(timers.size).toBe(1);
  } finally {
    await act(async () => { root.unmount(); });
    expect(timers.size).toBe(0);
    clock.mockRestore();
    schedule.mockRestore();
    cancel.mockRestore();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    await window.happyDOM.close();
  }
});
