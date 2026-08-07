import { describe, expect, test } from 'bun:test';
import {
  chordList,
  isEditableTarget,
  matchesChord,
  normalizeEventKey,
  parseChord,
} from './keybind';

function keyEvent(
  key: string,
  mods: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }> = {},
) {
  return {
    key,
    ctrlKey: !!mods.ctrlKey,
    metaKey: !!mods.metaKey,
    altKey: !!mods.altKey,
    shiftKey: !!mods.shiftKey,
  };
}

describe('parseChord', () => {
  test('parses mod+s', () => {
    expect(parseChord('mod+s')).toEqual({
      ctrl: false,
      meta: false,
      alt: false,
      shift: false,
      mod: true,
      key: 's',
    });
  });

  test('aliases and case', () => {
    expect(parseChord('Ctrl+Escape').key).toBe('escape');
    expect(parseChord('cmd+return').meta).toBe(true);
    expect(parseChord('CMD+RETURN').key).toBe('enter');
    expect(parseChord('option+up').alt).toBe(true);
    expect(parseChord('option+up').key).toBe('arrowup');
    expect(parseChord('shift+?').key).toBe('?');
    expect(parseChord('shift+?').shift).toBe(true);
  });
});

describe('normalizeEventKey', () => {
  test('maps space and lowercases', () => {
    expect(normalizeEventKey(' ')).toBe('space');
    expect(normalizeEventKey('Escape')).toBe('escape');
    expect(normalizeEventKey('S')).toBe('s');
  });
});

describe('matchesChord', () => {
  test('mod+s is Meta on Apple, Ctrl elsewhere', () => {
    const metaS = keyEvent('s', { metaKey: true });
    const ctrlS = keyEvent('s', { ctrlKey: true });
    expect(matchesChord(metaS, 'mod+s', { isApple: true })).toBe(true);
    expect(matchesChord(ctrlS, 'mod+s', { isApple: true })).toBe(false);
    expect(matchesChord(ctrlS, 'mod+s', { isApple: false })).toBe(true);
    expect(matchesChord(metaS, 'mod+s', { isApple: false })).toBe(false);
  });

  test('exact modifiers — bare s does not match ctrl+s', () => {
    expect(matchesChord(keyEvent('s'), 's')).toBe(true);
    expect(matchesChord(keyEvent('s', { ctrlKey: true }), 's')).toBe(false);
    expect(matchesChord(keyEvent('s', { ctrlKey: true }), 'ctrl+s')).toBe(true);
  });

  test('shift+?', () => {
    expect(matchesChord(keyEvent('?', { shiftKey: true }), 'shift+?')).toBe(true);
    expect(matchesChord(keyEvent('?'), 'shift+?')).toBe(false);
  });

  test('escape / enter aliases', () => {
    expect(matchesChord(keyEvent('Escape'), 'esc')).toBe(true);
    expect(matchesChord(keyEvent('Enter'), 'return')).toBe(true);
    expect(matchesChord(keyEvent(' '), 'space')).toBe(true);
  });

  test('arrow names', () => {
    expect(matchesChord(keyEvent('ArrowDown'), 'down')).toBe(true);
    expect(matchesChord(keyEvent('ArrowLeft', { altKey: true }), 'alt+left')).toBe(true);
  });
});

describe('chordList', () => {
  test('normalizes string or array', () => {
    expect(chordList('mod+s')).toEqual(['mod+s']);
    expect(chordList(['mod+s', 'ctrl+s'])).toEqual(['mod+s', 'ctrl+s']);
    expect(chordList('')).toEqual([]);
    expect(chordList(null)).toEqual([]);
  });
});

describe('isEditableTarget', () => {
  test('detects input / textarea / select / contenteditable', () => {
    expect(isEditableTarget({ tagName: 'INPUT' } as EventTarget)).toBe(true);
    expect(isEditableTarget({ tagName: 'TEXTAREA' } as EventTarget)).toBe(true);
    expect(isEditableTarget({ tagName: 'SELECT' } as EventTarget)).toBe(true);
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: false } as EventTarget)).toBe(
      false,
    );
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: true } as EventTarget)).toBe(
      true,
    );
    expect(isEditableTarget(null)).toBe(false);
  });

  test('nested contenteditable via closest', () => {
    const inner = {
      tagName: 'SPAN',
      isContentEditable: false,
      closest: (sel: string) => (sel === '[contenteditable="true"]' ? {} : null),
    };
    expect(isEditableTarget(inner as unknown as EventTarget)).toBe(true);
  });
});
