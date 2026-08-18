import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  draft,
  page,
  resetIdSequence,
  runWithSession,
  storage,
} from '@close-by/clay-core';

beforeEach(() => {
  clearPages();
  resetIdSequence();
  storage.clearAll();
  page('/draft-test', () => {});
});

function withSession(fn: () => void): ClientSession {
  const session = new ClientSession('/draft-test', () => {});
  session.mount();
  runWithSession(session, fn);
  return session;
}

describe('draft', () => {
  test('hydrates from storage.tab and write-through on assign', () => {
    const session = new ClientSession('/draft-test', () => {});
    session.tab.set('formDemo', { name: 'Ada', email: 'ada@ex.com' });
    session.mount();

    runWithSession(session, () => {
      const form = draft('formDemo', { name: '', email: '', age: '25' });
      expect(form.name).toBe('Ada');
      expect(form.email).toBe('ada@ex.com');
      expect(form.age).toBe('25');

      form.name = 'Grace';
      expect(storage.tab.get('formDemo')).toEqual({
        name: 'Grace',
        email: 'ada@ex.com',
        age: '25',
      });
    });
  });

  test('omit keys are never hydrated or written', () => {
    withSession(() => {
      storage.tab.set('sec', { name: 'x', secret: 'leak' });
      const form = draft(
        'sec',
        { name: '', secret: '' },
        { omit: ['secret'] },
      );
      expect(form.name).toBe('x');
      expect(form.secret).toBe('');

      form.secret = 'new-secret';
      form.name = 'y';
      expect(storage.tab.get('sec')).toEqual({ name: 'y' });
    });
  });

  test('draft.clear removes the storage key', () => {
    withSession(() => {
      const form = draft('formDemo', { name: '' });
      form.name = 'Ada';
      expect(storage.tab.has('formDemo')).toBe(true);
      draft.clear('formDemo');
      expect(storage.tab.has('formDemo')).toBe(false);
      expect(form.name).toBe('Ada');
    });
  });

  test('partial saved bags merge over defaults', () => {
    withSession(() => {
      storage.tab.set('formDemo', { name: 'Ada' });
      const form = draft('formDemo', { name: '', email: '', plan: 'free' });
      expect(form).toMatchObject({ name: 'Ada', email: '', plan: 'free' });
    });
  });

  test('storage: client scope', () => {
    withSession(() => {
      const form = draft('c', { n: 0 }, { storage: 'client' });
      form.n = 3;
      expect(storage.client.get('c')).toEqual({ n: 3 });
      draft.clear('c', 'client');
      expect(storage.client.has('c')).toBe(false);
    });
  });
});
