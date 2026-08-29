import { describe, expect, test } from 'bun:test';
import { hasIcon, listIconNames, lucideNameToKebab, resolveIcon } from './icons.ts';

describe('lucideNameToKebab', () => {
  test('converts PascalCase and Icon suffix', () => {
    expect(lucideNameToKebab('Home')).toBe('home');
    expect(lucideNameToKebab('RefreshCw')).toBe('refresh-cw');
    expect(lucideNameToKebab('ChartNoAxesGantt')).toBe('chart-no-axes-gantt');
    expect(lucideNameToKebab('RefreshCwIcon')).toBe('refresh-cw');
  });
});

describe('resolveIcon', () => {
  test('resolves curated and arbitrary lucide names', () => {
    expect(resolveIcon('copy')).toBeTruthy();
    expect(resolveIcon('refresh-cw')).toBeTruthy();
    expect(resolveIcon('external-link')).toBeTruthy();
    expect(resolveIcon('pencil')).toBeTruthy();
    expect(resolveIcon('trash-2')).toBeTruthy();
    expect(resolveIcon('sparkles')).toBeTruthy();
  });

  test('keeps lucide + clay aliases', () => {
    expect(hasIcon('home')).toBe(true); // Lucide Home → House alias
    expect(hasIcon('house')).toBe(true);
    expect(hasIcon('help-circle')).toBe(true);
    expect(hasIcon('chart-radar')).toBe(true);
    expect(hasIcon('chart-radial')).toBe(true);
    expect(resolveIcon('home')).toBe(resolveIcon('house'));
  });

  test('unknown falls back to boxes', () => {
    expect(resolveIcon('not-a-real-icon-xyz')).toBe(resolveIcon('boxes'));
    expect(resolveIcon()).toBe(resolveIcon('boxes'));
  });

  test('registry is large (full lucide surface)', () => {
    expect(listIconNames().length).toBeGreaterThan(1500);
  });
});
