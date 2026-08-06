import { describe, expect, test } from 'bun:test';
import { nextOptimisticValue } from './optimisticValue';

describe('nextOptimisticValue', () => {
  test('keeps local edits while server value is unchanged', () => {
    expect(nextOptimisticValue('server', 'server', 'typed')).toBe('typed');
  });

  test('adopts a new server value (reconcile)', () => {
    expect(nextOptimisticValue('', 'hello', 'typed')).toBe('');
  });
});
