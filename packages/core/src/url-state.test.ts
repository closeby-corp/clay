import { describe, expect, test } from 'bun:test';
import { runWithSession } from './context';
import { ClientSession } from './session';
import { urlState } from './url-state';
import type { ServerMessage } from './protocol';

describe('urlState', () => {
  test('hydrates from session search and write-through syncs', async () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/url-state', (m) => messages.push(m));
    session.urlSearch = 'partner=UBER&page=3';
    session.mount();

    const filters = runWithSession(session, () =>
      urlState({
        tab: 'dashboard',
        partner: '',
        page: 1,
      }),
    );

    expect(filters.partner).toBe('UBER');
    expect(filters.page).toBe(3);
    expect(filters.tab).toBe('dashboard');

    filters.partner = 'GLOVO';
    filters.page = 1; // default → omitted
    await Promise.resolve(); // flush microtask

    expect(session.urlSearch).toBe('partner=GLOVO');
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'setUrlSearch',
          search: 'partner=GLOVO',
          mode: 'replace',
        }),
      ]),
    );
  });

  test('supports key remapping and booleans', async () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/url-state', (m) => messages.push(m));
    session.urlSearch = 'p=2&failed=true';
    session.mount();

    const filters = runWithSession(session, () =>
      urlState({ page: 1, failed: false }, { keys: { page: 'p' } }),
    );
    expect(filters.page).toBe(2);
    expect(filters.failed).toBe(true);

    filters.failed = false;
    await Promise.resolve();
    expect(session.urlSearch).toBe('p=2');
    expect(messages.some((m) => m.op === 'setUrlSearch')).toBe(true);
  });

  test('empty numeric query keeps the default (not 0)', () => {
    const session = new ClientSession('/url-state', () => {});
    session.urlSearch = 'page=';
    session.mount();

    const filters = runWithSession(session, () => urlState({ page: 1 }));
    expect(filters.page).toBe(1);
  });

  test('batches multiple writes into one URL update', async () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/url-state', (m) => messages.push(m));
    session.mount();

    const filters = runWithSession(session, () => urlState({ a: '', b: '' }));
    filters.a = '1';
    filters.b = '2';
    await Promise.resolve();

    const searchOps = messages.filter((m) => m.op === 'setUrlSearch');
    expect(searchOps).toHaveLength(1);
    expect(searchOps[0]).toEqual({
      op: 'setUrlSearch',
      search: 'a=1&b=2',
      mode: 'replace',
    });
  });

  test('urlchange re-hydrates in place without setUrlSearch echo', async () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/url-state', (m) => messages.push(m));
    session.urlSearch = 'partner=UBER&page=2';
    session.mount();

    const filters = runWithSession(session, () =>
      urlState({
        tab: 'dashboard',
        partner: '',
        page: 1,
      }),
    );
    expect(filters.partner).toBe('UBER');
    expect(filters.page).toBe(2);

    messages.length = 0;
    await session.handleMessage({
      op: 'urlchange',
      search: 'partner=GLOVO',
      hash: '',
    });
    await Promise.resolve(); // any suppressed microtask would flush here

    expect(session.urlSearch).toBe('partner=GLOVO');
    expect(filters.partner).toBe('GLOVO');
    expect(filters.page).toBe(1); // missing → default
    expect(filters.tab).toBe('dashboard');
    expect(messages.filter((m) => m.op === 'setUrlSearch')).toHaveLength(0);
  });
});
