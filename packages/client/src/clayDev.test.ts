import { describe, expect, test } from 'bun:test';
import { isClayDev, withClayDevComments } from './clayDev';

describe('clayDev', () => {
  test('isClayDev is false without window flag in non-Vite-DEV', () => {
    // Bun unit tests: no window; Vite DEV may still be true in some runners.
    const flagged =
      typeof window !== 'undefined' && (window as Window & { __CLAY_DEV__?: boolean }).__CLAY_DEV__;
    if (flagged) {
      expect(isClayDev()).toBe(true);
    } else if (!import.meta.env.DEV) {
      expect(isClayDev()).toBe(false);
    }
  });

  test('withClayDevComments is identity when not in clay dev', () => {
    const child = 'ok';
    const out = withClayDevComments('label', child);
    if (!isClayDev()) {
      expect(out).toBe(child);
    } else {
      expect(out).not.toBe(child);
    }
  });
});
