import { describe, expect, test } from 'bun:test';
import { runWithSession } from '@close-by/clay-core';
import { app } from './app';

function headerTitleAt(path: string, props: Parameters<typeof app>[0]): string {
  let headerTitle = '';
  runWithSession(
    {
      path,
      register() {},
      unregister() {},
    } as any,
    () => {
      headerTitle = String(app(props, () => {}).props.headerTitle ?? '');
    },
  );
  return headerTitle;
}

describe('app layout', () => {
  test('marks active nav item from session path', () => {
    const session = {
      path: '/examples/counter',
      register() {},
      unregister() {},
    } as any;
    runWithSession(session, () => {
      const el = app(
        {
          title: 'Clay',
          nav: [
            { label: 'Home', href: '/', icon: 'home' },
            { label: 'Counter', href: '/examples/counter', icon: 'gauge' },
            { label: 'Todo', href: '/examples/todo', icon: 'list-todo' },
          ],
          navSecondary: [{ label: 'Settings', href: '#settings', icon: 'settings' }],
          documents: [{ label: 'Reports', href: '#reports', icon: 'clipboard-list' }],
          primaryAction: { label: 'New report', href: '/reports/new', icon: 'plus' },
          user: { name: 'Ada', email: 'ada@example.com' },
        },
        () => {},
      );
      const nav = el.props.nav as Array<{ href: string; active: boolean; icon?: string }>;
      expect(nav.find((n) => n.href === '/')?.active).toBe(false);
      expect(nav.find((n) => n.href === '/examples/counter')?.active).toBe(true);
      expect(nav.find((n) => n.href === '/examples/todo')?.active).toBe(false);
      expect(el.props.headerTitle).toBe('Counter');
      expect(el.props.collapsible).toBe('icon');
      expect(el.props.variant).toBe('inset');
      expect(el.props.user).toEqual({ name: 'Ada', email: 'ada@example.com' });
      expect(el.props.primaryAction).toEqual({
        label: 'New report',
        href: '/reports/new',
        icon: 'plus',
      });
      expect((el.props.navSecondary as unknown[]).length).toBe(1);
      expect((el.props.documents as unknown[]).length).toBe(1);
      expect(nav.find((n) => n.href === '/examples/counter')?.icon).toBe('gauge');
    });
  });

  test('marks nested nav child active and uses child label in header', () => {
    const session = {
      path: '/examples/charts',
      register() {},
      unregister() {},
    } as any;
    runWithSession(session, () => {
      const el = app(
        {
          title: 'Clay',
          nav: [
            { label: 'Home', href: '/', icon: 'home' },
            {
              label: 'Examples',
              href: '/examples/counter',
              icon: 'layout-grid',
              items: [
                { label: 'Counter', href: '/examples/counter', icon: 'gauge' },
                { label: 'Charts', href: '/examples/charts', icon: 'chart-area' },
              ],
            },
          ],
        },
        () => {},
      );
      const nav = el.props.nav as Array<{
        label: string;
        active: boolean;
        items?: Array<{ href: string; active: boolean; label: string }>;
      }>;
      const examples = nav.find((n) => n.label === 'Examples');
      expect(examples?.active).toBe(true);
      expect(examples?.items?.find((n) => n.href === '/examples/charts')?.active).toBe(true);
      expect(el.props.headerTitle).toBe('Charts');
    });
  });

  test('uses the most specific active path among nav siblings', () => {
    expect(
      headerTitleAt('/docs/guide', {
        title: 'Clay',
        nav: [
          { label: 'Docs', href: '/docs' },
          { label: 'Guide', href: '/docs/guide' },
        ],
      }),
    ).toBe('Guide');
  });

  test('uses the active grandchild instead of its group label', () => {
    expect(
      headerTitleAt('/users/alice', {
        title: 'Clay',
        nav: [
          {
            label: 'Admin',
            href: '/users',
            items: [
              {
                label: 'Users',
                href: '/users',
                items: [{ label: 'Alice', href: '/users/alice' }],
              },
            ],
          },
        ],
      }),
    ).toBe('Alice');
  });

  test('does not let a group href outrank a short active child route', () => {
    expect(
      headerTitleAt('/r', {
        title: 'Clay',
        nav: [
          {
            label: 'Reports',
            href: '/reports/long-first-route',
            items: [
              { label: 'Long report', href: '/reports/long-first-route' },
              { label: 'Short', href: '/r' },
            ],
          },
        ],
      }),
    ).toBe('Short');
  });

  test('uses active secondary and document labels for the header', () => {
    expect(
      headerTitleAt('/settings/profile', {
        title: 'Clay',
        nav: [{ label: 'Home', href: '/' }],
        navSecondary: [{ label: 'Settings', href: '/settings' }],
      }),
    ).toBe('Settings');
    expect(
      headerTitleAt('/reports/weekly', {
        title: 'Clay',
        nav: [{ label: 'Home', href: '/' }],
        documents: [{ label: 'Reports', href: '/reports' }],
      }),
    ).toBe('Reports');
  });

  test('keeps explicit headerTitle and falls back to the brand without an active route', () => {
    expect(
      headerTitleAt('/docs/guide', {
        title: 'Clay',
        headerTitle: 'Workspace',
        nav: [{ label: 'Guide', href: '/docs/guide' }],
      }),
    ).toBe('Workspace');
    expect(
      headerTitleAt('/docs/guide', {
        title: 'Clay',
        headerTitle: '',
        nav: [{ label: 'Guide', href: '/docs/guide' }],
      }),
    ).toBe('');
    expect(
      headerTitleAt('/unknown', {
        title: 'My App',
        nav: [{ label: 'Guide', href: '/docs/guide' }],
      }),
    ).toBe('My App');
    expect(headerTitleAt('/unknown', { nav: [] })).toBe('Clay');
  });

  test('omits primaryAction by default', () => {
    const session = {
      path: '/',
      register() {},
      unregister() {},
    } as any;
    runWithSession(session, () => {
      const el = app({ title: 'Clay', nav: [{ label: 'Home', href: '/' }] }, () => {});
      expect(el.props.primaryAction).toBeNull();
    });
  });
});
