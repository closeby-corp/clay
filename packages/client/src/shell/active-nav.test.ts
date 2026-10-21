import { describe, expect, test } from 'bun:test';
import { findActiveNavItem, resolveAppShellTitle } from './active-nav';

describe('active app-shell title selection', () => {
  test('prefers the longer active sibling path', () => {
    expect(
      findActiveNavItem([
        { label: 'Docs', href: '/docs', active: true },
        { label: 'Guide', href: '/docs/guide', active: true },
      ])?.label,
    ).toBe('Guide');
  });

  test('recurses through nested groups and skips active ancestors', () => {
    expect(
      findActiveNavItem([
        {
          label: 'Admin',
          href: '/users',
          active: true,
          items: [
            {
              label: 'Users',
              href: '/users',
              active: true,
              items: [{ label: 'Alice', href: '/users/alice', active: true }],
            },
          ],
        },
      ])?.label,
    ).toBe('Alice');
  });

  test('does not let a synthetic group href outrank its active child', () => {
    expect(
      findActiveNavItem([
        {
          label: 'Reports',
          href: '/reports/long-first-route',
          active: true,
          items: [
            { label: 'Long report', href: '/reports/long-first-route', active: false },
            { label: 'Short', href: '/r', active: true },
          ],
        },
      ])?.label,
    ).toBe('Short');
  });

  test('considers secondary and document navigation', () => {
    expect(
      resolveAppShellTitle({
        title: 'Clay',
        nav: [],
        navSecondary: [{ label: 'Settings', href: '/settings', active: true }],
      }),
    ).toBe('Settings');
    expect(
      resolveAppShellTitle({
        title: 'Clay',
        nav: [],
        documents: [{ label: 'Reports', href: '/reports', active: true }],
      }),
    ).toBe('Reports');
  });

  test('respects an explicit heading and falls back to the brand', () => {
    expect(
      resolveAppShellTitle({
        title: 'Clay',
        headerTitle: 'Workspace',
        nav: [{ label: 'Guide', href: '/guide', active: true }],
      }),
    ).toBe('Workspace');
    expect(
      resolveAppShellTitle({
        title: 'Clay',
        headerTitle: '',
        nav: [{ label: 'Guide', href: '/guide', active: true }],
      }),
    ).toBe('');
    expect(resolveAppShellTitle({ title: 'My App', nav: [] })).toBe('My App');
    expect(resolveAppShellTitle({ title: '', nav: [] })).toBe('Clay');
  });
});
