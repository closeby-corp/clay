import { describe, expect, test } from 'bun:test';
import { diffRowKeys } from './rowChanges';

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
