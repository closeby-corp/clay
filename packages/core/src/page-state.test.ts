import { describe, expect, test } from 'bun:test';
import { createPageState } from './page-state';

describe('createPageState', () => {
  test('reads and writes properties with assignment', () => {
    const state = createPageState(null);

    state.defaults({ count: 0 });
    expect(state.count).toBe(0);

    state.count = 5;
    expect(state.count).toBe(5);
  });

  test('defaults only sets missing keys', () => {
    const state = createPageState(null);

    state.defaults({ count: 0 });
    state.count = 7;
    state.defaults({ count: 0, name: 'test' });

    expect(state.count).toBe(7);
    expect(state.name).toBe('test');
  });

  test('supports array mutation', () => {
    const state = createPageState(null);

    state.defaults({ history: [] as number[] });
    state.history.push(1);
    state.history.push(2);

    expect(state.history.length).toBe(2);
    expect(state.history.join(',')).toBe('1,2');
  });

  test('supports assignment expressions', () => {
    const state = createPageState(null);

    state.defaults({ count: 0 });
    state.count = state.count + 1;
    expect(state.count).toBe(1);

    state.count = state.count - 1;
    expect(state.count).toBe(0);
  });
});
