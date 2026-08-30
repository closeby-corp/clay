import { describe, expect, test } from 'bun:test';
import { sameOptimisticValue } from './useOptimisticValue';

describe('sameOptimisticValue', () => {
  test('treats equal array contents as same even when references differ', () => {
    expect(sameOptimisticValue(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(sameOptimisticValue([], [])).toBe(true);
    expect(sameOptimisticValue(['a'], ['b'])).toBe(false);
    expect(sameOptimisticValue(['a'], ['a', 'b'])).toBe(false);
  });

  test('uses Object.is for primitives', () => {
    expect(sameOptimisticValue(true, true)).toBe(true);
    expect(sameOptimisticValue(true, false)).toBe(false);
    expect(sameOptimisticValue(1, 1)).toBe(true);
  });
});
