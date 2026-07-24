import { describe, expect, test } from 'bun:test';
import { Element, withDetached, withParent } from '@badui/core';

describe('withDetached', () => {
  test('does not attach created elements to the current parent', () => {
    const parent = new Element('column', {});
    let child!: Element;
    withParent(parent, () => {
      withDetached(() => {
        child = new Element('badge', { text: 'x' });
      });
    });
    expect(parent.children).toHaveLength(0);
    expect(child.parent).toBeNull();
  });
});
