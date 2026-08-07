import { describe, expect, test } from 'bun:test';
import { ClientSession } from './session';

describe('ClientSession timeouts', () => {
  test('isExpired respects idle timeout', () => {
    const session = new ClientSession('/x', () => {});
    session.timeouts = { idleMs: 100 };
    expect(session.isExpired()).toBe(false);

    session.lastActivityAt = Date.now() - 200;
    expect(session.isExpired()).toBe(true);

    session.touch();
    expect(session.isExpired()).toBe(false);
  });

  test('isExpired respects absolute timeout', () => {
    const messages: unknown[] = [];
    const session = new ClientSession('/x', (m) => messages.push(m));
    session.timeouts = { absoluteMs: 0 };
    expect(session.isExpired(session.createdAt + 1)).toBe(true);
  });

  test('reconnect and authSession emit protocol ops', () => {
    const messages: unknown[] = [];
    const session = new ClientSession('/x', (m) => messages.push(m));
    session.reconnect();
    session.authSession('establish', { token: 't', path: '/a' });
    session.authSession('clear', { path: '/login' });
    expect(messages).toEqual([
      { op: 'reconnect' },
      { op: 'authSession', action: 'establish', token: 't', path: '/a' },
      { op: 'authSession', action: 'clear', token: undefined, path: '/login' },
    ]);
  });
});
