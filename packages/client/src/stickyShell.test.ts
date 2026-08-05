import { describe, expect, test } from 'bun:test';
import type { ElementNode } from './protocol';
import {
  STICKY_APP_KEY,
  elementReactKey,
  findAppShell,
  hasMatchingAppShell,
} from './stickyShell';

function node(
  type: string,
  props: Record<string, unknown> = {},
  children: ElementNode[] = [],
  id = `${type}-1`,
): ElementNode {
  return { id, type, props, children };
}

describe('elementReactKey', () => {
  test('uses stable key for app; id for everything else', () => {
    expect(elementReactKey(node('app', { title: 'A' }, [], 'app-xyz'))).toBe(STICKY_APP_KEY);
    expect(elementReactKey(node('label', { text: 'x' }, [], 'label-1'))).toBe('label-1');
  });
});

describe('findAppShell / hasMatchingAppShell', () => {
  test('finds app under root', () => {
    const tree = node('root', {}, [node('app', { title: 'Demo' }, [node('label')])]);
    expect(findAppShell(tree)?.props.title).toBe('Demo');
  });

  test('matches chrome identity across remounts with different ids', () => {
    const prev = node('root', {}, [
      node('app', { title: 'Demo', collapsible: 'icon', variant: 'inset', nav: [{ active: true }] }, [], 'app-old'),
    ]);
    const next = node('root', {}, [
      node('app', { title: 'Demo', collapsible: 'icon', variant: 'inset', nav: [{ active: false }] }, [], 'app-new'),
    ]);
    expect(hasMatchingAppShell(prev, next)).toBe(true);
  });

  test('does not match when shell chrome differs or missing', () => {
    const withShell = node('root', {}, [node('app', { title: 'A' })]);
    const otherTitle = node('root', {}, [node('app', { title: 'B' })]);
    const bare = node('root', {}, [node('label', { text: 'hi' })]);
    expect(hasMatchingAppShell(withShell, otherTitle)).toBe(false);
    expect(hasMatchingAppShell(withShell, bare)).toBe(false);
    expect(hasMatchingAppShell(null, withShell)).toBe(false);
  });
});
