import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  ClientSession,
  Element,
  clearPages,
  page,
  setPageWrapper,
  withParent,
  type ElementNode,
} from './index.ts';

beforeEach(() => {
  clearPages();
  setPageWrapper(null);
});

afterEach(() => {
  clearPages();
  setPageWrapper(null);
});

describe('page wrapper', () => {
  test('applies pageWrapper around page fn on mount', () => {
    page('/x', () => {
      new Element('label', { text: 'content' });
    });

    setPageWrapper((runPage) => {
      const shell = new Element('app', { title: 'Shell' });
      withParent(shell, runPage);
    });

    let tree: ElementNode | null = null;
    const session = new ClientSession('/x', (msg) => {
      if (msg.op === 'mount') tree = msg.tree;
    });
    session.mount();

    expect(tree!.children.map((c) => c.type)).toEqual(['app']);
    expect(tree!.children[0]!.children.map((c) => c.type)).toEqual(['label']);
  });

  test('shell: false skips wrapper', () => {
    page(
      '/bare',
      () => {
        new Element('label', { text: 'bare' });
      },
      { shell: false },
    );

    setPageWrapper((runPage) => {
      const shell = new Element('app', { title: 'Shell' });
      withParent(shell, runPage);
    });

    let tree: ElementNode | null = null;
    const session = new ClientSession('/bare', (msg) => {
      if (msg.op === 'mount') tree = msg.tree;
    });
    session.mount();

    expect(tree!.children.map((c) => c.type)).toEqual(['label']);
  });
});
