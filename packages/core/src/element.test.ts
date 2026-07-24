import { describe, expect, test } from 'bun:test';
import {
  ClientSession,
  Element,
  clearPages,
  page,
  reactive,
  runWithSession,
  withParent,
} from './index';

describe('element tree', () => {
  test('builds parent/child hierarchy', () => {
    clearPages();
    page('/t', () => {
      const row = new Element('row', {});
      withParent(row, () => {
        new Element('button', { text: 'A' });
        new Element('button', { text: 'B' });
      });
    });

    let tree: ReturnType<Element['toJSON']> | null = null;
    const session = new ClientSession('/t', (msg) => {
      if (msg.op === 'mount') tree = msg.tree;
    });
    session.mount();

    expect(tree).not.toBeNull();
    expect(tree!.type).toBe('root');
    expect(tree!.children[0].type).toBe('row');
    expect(tree!.children[0].children).toHaveLength(2);
  });

  test('setText queues updateProps patch', async () => {
    clearPages();
    let label!: Element;
    page('/label', () => {
      label = new Element('label', { text: 'hi' });
    });

    const patches: unknown[] = [];
    const session = new ClientSession('/label', (msg) => {
      if (msg.op === 'patch') patches.push(...msg.patches);
    });
    session.mount();
    label.setText('bye');
    await Promise.resolve();
    expect(patches).toContainEqual({ op: 'updateProps', id: label.id, props: { text: 'bye' } });
  });

  test('bindValue syncs reactive object', async () => {
    clearPages();
    const model = reactive({ name: 'Ada' });
    let input!: Element;
    page('/bind', () => {
      input = new Element('input', { value: '' });
      input.bindValue(model, 'name');
    });

    const session = new ClientSession('/bind', () => {});
    session.mount();
    expect(input.getValue()).toBe('Ada');

    await runWithSession(session, async () => {
      await input.handleEvent('input', 'Grace');
    });
    expect(model.name).toBe('Grace');
  });

  test('reactive assignment notifies bindValue subscribers', async () => {
    clearPages();
    const model = reactive({ name: 'Ada' });
    let input!: Element;
    const patches: unknown[] = [];
    page('/bind-notify', () => {
      input = new Element('input', { value: '' });
      input.bindValue(model, 'name');
    });

    const session = new ClientSession('/bind-notify', (msg) => {
      if (msg.op === 'patch') patches.push(...msg.patches);
    });
    session.mount();

    model.name = '';
    await Promise.resolve();
    expect(input.getValue()).toBe('');
    expect(patches).toContainEqual({ op: 'updateProps', id: input.id, props: { value: '' } });
  });
});
