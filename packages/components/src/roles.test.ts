import { afterEach, describe, expect, test } from 'bun:test';
import { ClientSession, Element, clearPages, forRoles, hasRole, page, setPageWrapper, setRoleResolver } from '@close-by/clay-core';

let roles: string[] = [];

function build(fn: () => void) {
  clearPages();
  setPageWrapper(null);
  setRoleResolver(() => roles);
  page('/r', fn);
  const session = new ClientSession('/r', () => {});
  session.mount();
  return session;
}


afterEach(() => setRoleResolver(null));

describe('role-based visibility', () => {
  test('forRoles builds content only for matching roles, else fallback', () => {
    for (const [r, expected] of [[['admin'], 'secret'], [['user'], 'ask'], [[], 'ask']] as const) {
      roles = [...r];
      const labels: string[] = [];
      build(() => {
        forRoles(['admin', 'manager'], () => labels.push('secret'), () => labels.push('ask'));
      });
      expect(labels).toEqual([expected]);
    }
  });

  test('element.roles() removes and unregisters the element for other roles', async () => {
    roles = ['user'];
    let hidden!: Element;
    let kept!: Element;
    const clicks: string[] = [];
    const session = build(() => {
      const col = new Element('column', {});
      col.add((hidden = new Element('button', { label: 'Delete', onClick: () => clicks.push('x') })));
      col.add((kept = new Element('button', { label: 'View' })));
      hidden.roles(['admin']);
      kept.roles(['admin', 'user']);
      expect(col.children).toEqual([kept]);
    });
    expect(session.getElement(hidden.id)).toBeUndefined();
    expect(session.getElement(kept.id)).toBe(kept);
    await session.handleMessage({ op: 'event', id: hidden.id, type: 'click' } as never);
    expect(clicks).toEqual([]);
  });

  test('hasRole accepts a single role or a list; empty list allows everyone', () => {
    roles = ['manager'];
    setRoleResolver(() => roles);
    expect(hasRole('manager')).toBe(true);
    expect(hasRole(['admin'])).toBe(false);
    expect(hasRole([])).toBe(true);
    setRoleResolver(() => null);
    expect(hasRole('manager')).toBe(false);
  });
});
