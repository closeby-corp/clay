import { describe, expect, test } from 'bun:test';
import { shouldHandleNavClick } from './types';

function click(overrides: Partial<Parameters<typeof shouldHandleNavClick>[0]> = {}) {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    ...overrides,
  };
}

describe('shouldHandleNavClick', () => {
  test('handles only unmodified primary clicks that remain uncancelled', () => {
    expect(shouldHandleNavClick(click())).toBe(true);
    expect(shouldHandleNavClick(click({ button: 1 }))).toBe(false);
    expect(shouldHandleNavClick(click({ button: 2 }))).toBe(false);
    expect(shouldHandleNavClick(click({ metaKey: true }))).toBe(false);
    expect(shouldHandleNavClick(click({ ctrlKey: true }))).toBe(false);
    expect(shouldHandleNavClick(click({ shiftKey: true }))).toBe(false);
    expect(shouldHandleNavClick(click({ altKey: true }))).toBe(false);
    expect(shouldHandleNavClick(click({ defaultPrevented: true }))).toBe(false);
  });
});
