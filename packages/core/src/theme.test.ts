import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  page,
  resetIdSequence,
  runWithSession,
  theme,
  type ServerMessage,
} from './index';

describe('theme API', () => {
  beforeEach(() => {
    clearPages();
    resetIdSequence();
    page('/theme-test', () => {});
  });

  test('theme.set sends theme op and theme.get returns last value', () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/theme-test', (m) => messages.push(m));
    session.mount();
    messages.length = 0;

    runWithSession(session, () => {
      expect(theme.get()).toBeNull();
      theme.set('dark');
      expect(theme.get()).toBe('dark');
      theme.set('system');
      expect(theme.get()).toBe('system');
    });

    const themes = messages.filter((m) => m.op === 'theme');
    expect(themes).toHaveLength(2);
    expect(themes[0]).toEqual({ op: 'theme', theme: 'dark' });
    expect(themes[1]).toEqual({ op: 'theme', theme: 'system' });
  });
});
