import { expect, spyOn, test } from 'bun:test';
import { ClientSession, runWithSession, storage } from '@close-by/clay-core';
import { ui, onDispose } from '@close-by/clay';
import { disposeSession } from './dispose';

test('disposal runs once in session context and unsubscribes app stores', async () => {
  const session = new ClientSession('/dispose', () => {});
  const store = storage.app.create('dispose-test', 0);
  let notifications = 0;
  let cleanups = 0;
  runWithSession(session, () => {
    ui.onDispose(store.subscribe(() => notifications++));
    onDispose(() => {
      storage.tab.set('cleanup', true);
      expect(storage.tab.get('cleanup')).toBe(true);
      cleanups++;
    });
  });
  await store.set(1);
  expect(notifications).toBe(1);
  disposeSession(session);
  disposeSession(session);
  await store.set(2);
  expect(notifications).toBe(1);
  expect(cleanups).toBe(1);
});

test('onDispose requires an active session', () => {
  expect(() => onDispose(() => {})).toThrow('active session');
});

test('a failing callback does not prevent other cleanup or session destruction', () => {
  const session = new ClientSession('/dispose-error', () => {});
  const logged = spyOn(console, 'error').mockImplementation(() => {});
  let cleaned = false;
  try {
    runWithSession(session, () => {
      storage.tab.set('key', 'value');
      onDispose(() => { throw new Error('cleanup failed'); });
      onDispose(() => { cleaned = true; });
    });
    disposeSession(session);
    expect(cleaned).toBe(true);
    expect(session.tab.size).toBe(0);
    expect(logged).toHaveBeenCalledTimes(1);
  } finally {
    logged.mockRestore();
  }
});
