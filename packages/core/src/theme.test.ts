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

  test('theme.palette sends palette op, getPalette tracks it, bad names throw', () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/theme-test', (m) => messages.push(m));
    session.mount();
    messages.length = 0;

    runWithSession(session, () => {
      expect(theme.getPalette()).toBeNull();
      theme.palette('ocean');
      expect(theme.getPalette()).toBe('ocean');
      expect(() => theme.palette('x"><script>')).toThrow();
      expect(theme.palettes).toContain('kiln');
    });

    expect(messages.filter((m) => m.op === 'palette')).toEqual([{ op: 'palette', palette: 'ocean' }]);
  });

  test('getPalette falls back to the palette the client reported on hello', () => {
    const session = new ClientSession('/theme-test', () => {});
    session.clientPalette = 'forest';
    session.mount();
    runWithSession(session, () => {
      expect(theme.getPalette()).toBe('forest');
      theme.palette('neon');
      expect(theme.getPalette()).toBe('neon');
    });
  });
});
