import { describe, expect, test } from 'bun:test';
import { runWithSession } from '@close-by/clay-core';
import { app } from './app';

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
