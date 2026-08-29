import { describe, expect, test, beforeEach } from 'bun:test';
import { Element } from './element.ts';
import {
  clearPages,
  page,
  resetIdSequence,
  ClientSession,
  runWithSession,
  withParent,
} from './index.ts';
import { jsx, jsxs, Fragment } from './jsx-runtime.ts';

describe('Element.adopt', () => {
  test('moves child between parents without destroy', () => {
    const a = new Element('row', {});
    const b = new Element('column', {});
    const child = new Element('label', { text: 'x' });
    a.add(child);
    expect(a.children).toHaveLength(1);
    b.adopt(child);
    expect(a.children).toHaveLength(0);
    expect(b.children).toEqual([child]);
    expect(child.parent).toBe(b);
  });
});

describe('jsx runtime', () => {
  beforeEach(() => {
    clearPages();
    resetIdSequence();
    page('/jsx', () => {});
  });

  test('builds nested clay intrinsics and reparents children', () => {
    const messages: unknown[] = [];
    const session = new ClientSession('/jsx', (m) => messages.push(m));
    session.mount();

    runWithSession(session, () => {
      const root = new Element('column', { className: 'root' });
      withParent(root, () => {
        jsx('row', {
          gap: 2,
          children: [
            jsx('badge', { text: 'ok', size: 'xs' }),
            jsx('button', { text: 'Go', variant: 'outline' }),
          ],
        });
      });

      expect(root.children).toHaveLength(1);
      const row = root.children[0]!;
      expect(row.type).toBe('row');
      expect(row.children.map((c) => c.type)).toEqual(['badge', 'button']);
      expect(row.children[0]!.props.text).toBe('ok');
      expect(row.children[1]!.props.text).toBe('Go');
    });
  });

  test('function components work', () => {
    function StatusDot(props: { ok: boolean }) {
      return jsx('badge', {
        text: props.ok ? 'up' : 'down',
        color: props.ok ? 'emerald' : 'red',
        size: 'xs',
      }) as Element;
    }

    const session = new ClientSession('/jsx', () => {});
    session.mount();
    runWithSession(session, () => {
      const host = new Element('column', {});
      withParent(host, () => {
        jsx(StatusDot, { ok: true });
      });
      expect(host.children[0]!.type).toBe('badge');
      expect(host.children[0]!.props.text).toBe('up');
    });
  });

  test('Fragment flattens into parent', () => {
    const session = new ClientSession('/jsx', () => {});
    session.mount();
    runWithSession(session, () => {
      const host = new Element('column', {});
      withParent(host, () => {
        jsxs(Fragment, {
          children: [jsx('label', { text: 'a' }), jsx('label', { text: 'b' })],
        });
      });
      expect(host.children.map((c) => c.props.text)).toEqual(['a', 'b']);
    });
  });

  test('string children become labels', () => {
    const session = new ClientSession('/jsx', () => {});
    session.mount();
    runWithSession(session, () => {
      const host = new Element('column', {});
      withParent(host, () => {
        jsx('row', { children: 'hello' });
      });
      expect(host.children[0]!.children[0]!.type).toBe('label');
      expect(host.children[0]!.children[0]!.props.text).toBe('hello');
    });
  });
});
