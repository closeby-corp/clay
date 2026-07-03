import { describe, expect, mock, test } from 'bun:test';
import { State } from './state';
import { createReactiveState } from './reactive';

describe('createReactiveState', () => {
  test('reads and writes through get/set', () => {
    const backing = new State(0);
    const count = createReactiveState(backing);

    expect(count.get()).toBe(0);
    count.set(5);
    expect(count.get()).toBe(5);
    expect(backing.get()).toBe(5);
  });

  test('notifies subscribers on set', () => {
    const backing = new State(0);
    const count = createReactiveState(backing);
    const listener = mock((newVal: number, oldVal: number) => {});

    count.subscribe(listener);
    count.set(2);

    expect(listener).toHaveBeenCalledWith(2, 0);
  });

  test('supports array property access without get()', () => {
    const backing = new State<number[]>([]);
    const history = createReactiveState(backing);

    expect(history.length).toBe(0);
    history.push(1);
    history.push(2);

    expect(history.length).toBe(2);
    expect(history.join(',')).toBe('1,2');
    expect(backing.get()).toEqual([1, 2]);
  });

  test('supports increment/decrement for numbers', () => {
    const count = createReactiveState(new State(0));
    count.increment();
    expect(count.get()).toBe(1);
    count.decrement();
    expect(count.get()).toBe(0);
  });

  test('coerces to primitive for template strings', () => {
    const count = createReactiveState(new State(7));
    expect(`${count}`).toBe('7');
    expect(Number(count)).toBe(7);
  });
});
