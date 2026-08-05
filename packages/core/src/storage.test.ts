import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  createMemoryPersistence,
  page,
  resetIdSequence,
  runWithSession,
  setCurrentSession,
  storage,
} from '@badui/core';

beforeEach(() => {
  clearPages();
  resetIdSequence();
  storage.clearAll();
  page('/storage-test', () => {});
});

describe('storage.tab', () => {
  test('get/set survive within the session and clear on destroy', () => {
    const session = new ClientSession('/storage-test', () => {});
    session.mount();

    runWithSession(session, () => {
      expect(storage.tab.get('n')).toBeUndefined();
      storage.tab.set('n', 1);
      expect(storage.tab.get<number>('n')).toBe(1);
      expect(storage.tab.has('n')).toBe(true);
    });

    expect(session.tab.get('n')).toBe(1);

    session.destroy();
    expect(session.tab.size).toBe(0);
  });
});

describe('storage.user', () => {
  test('requires userId on the session', async () => {
    const session = new ClientSession('/storage-test', () => {});
    session.mount();
    setCurrentSession(session);
    try {
      await expect(storage.user.get('x')).rejects.toThrow(/userId/);
    } finally {
      setCurrentSession(null);
    }
  });

  test('persists bag via adapter under user:<id>', async () => {
    const memory = createMemoryPersistence();
    storage.configure({ persistence: memory });

    const session = new ClientSession('/storage-test', () => {});
    session.userId = 'user-abc';
    session.mount();

    setCurrentSession(session);
    try {
      await storage.user.set('theme', 'dark');
      expect(await storage.user.get('theme')).toBe('dark');
      expect(await storage.user.has('theme')).toBe(true);
    } finally {
      setCurrentSession(null);
    }

    expect(await memory.load('user:user-abc')).toBe(JSON.stringify({ theme: 'dark' }));

    setCurrentSession(session);
    try {
      await storage.user.delete('theme');
      expect(await storage.user.get('theme')).toBeUndefined();
    } finally {
      setCurrentSession(null);
    }
  });

  test('memory fallback without configure', async () => {
    const session = new ClientSession('/storage-test', () => {});
    session.userId = 'u1';
    session.mount();

    setCurrentSession(session);
    try {
      await storage.user.set('count', 3);
      expect(await storage.user.get<number>('count')).toBe(3);
    } finally {
      setCurrentSession(null);
    }
  });
});
