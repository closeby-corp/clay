import { describe, expect, test } from 'bun:test';
import { applyPatch } from './applyPatch';
import type { ElementNode } from './protocol';

function node(
  type: string,
  props: Record<string, unknown> = {},
  children: ElementNode[] = [],
  id = `${type}-1`,
): ElementNode {
  return { id, type, props, children };
}

describe('applyPatch', () => {
  test('replace swaps the matching node', () => {
    const tree = node('root', {}, [node('label', { text: 'a' }, [], 'label-1')]);
    const next = applyPatch(tree, {
      op: 'replace',
      id: 'label-1',
      node: node('label', { text: 'b' }, [], 'label-1'),
    });
    expect(next.children[0]?.props.text).toBe('b');
  });

  test('remove drops the matching child', () => {
    const tree = node('root', {}, [
      node('label', { text: 'a' }, [], 'label-1'),
      node('label', { text: 'b' }, [], 'label-2'),
    ]);
    const next = applyPatch(tree, { op: 'remove', id: 'label-1' });
    expect(next.children.map((c) => c.id)).toEqual(['label-2']);
  });

  test('updateProps shallow-merges props on the matching node', () => {
    const tree = node('root', {}, [node('input', { value: 'x', disabled: false }, [], 'in-1')]);
    const next = applyPatch(tree, {
      op: 'updateProps',
      id: 'in-1',
      props: { value: 'y' },
    });
    expect(next.children[0]?.props).toEqual({ value: 'y', disabled: false });
  });

  test('updateProps null removes a prop', () => {
    const tree = node('root', {}, [
      node('button', { variant: 'outline', className: 'bg-accent' }, [], 'btn-1'),
    ]);
    const next = applyPatch(tree, {
      op: 'updateProps',
      id: 'btn-1',
      props: { className: null },
    });
    expect(next.children[0]?.props).toEqual({ variant: 'outline' });
  });

  test('setChildren replaces children on the matching node', () => {
    const tree = node('root', {}, [node('column', {}, [node('label', { text: 'old' })], 'col-1')]);
    const next = applyPatch(tree, {
      op: 'setChildren',
      id: 'col-1',
      children: [node('label', { text: 'new' }, [], 'label-new')],
    });
    expect(next.children[0]?.children).toEqual([
      node('label', { text: 'new' }, [], 'label-new'),
    ]);
  });

  test('unknown op leaves the tree unchanged', () => {
    const tree = node('root', {}, [node('label')]);
    const next = applyPatch(tree, { op: 'noop' } as never);
    expect(next).toBe(tree);
  });
  test('appendRows appends to an array prop and trims to max', () => {
    const tree = node('root', {}, [node('linechart', { data: [{ x: 1 }, { x: 2 }] }, [], 'c-1')]);
    const next = applyPatch(tree, { op: 'appendRows', id: 'c-1', prop: 'data', rows: [{ x: 3 }, { x: 4 }], max: 3 });
    expect(next.children[0]?.props.data).toEqual([{ x: 2 }, { x: 3 }, { x: 4 }]);
    const fresh = applyPatch(node('linechart', {}, [], 'c-1'), { op: 'appendRows', id: 'c-1', prop: 'data', rows: [{ x: 1 }] });
    expect(fresh.props.data).toEqual([{ x: 1 }]);
  });
});
