import { describe, expect, test } from 'bun:test';
import { runWithSession } from '@badui/core';
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
          title: 'BadUI',
          nav: [
            { label: 'Home', href: '/' },
            { label: 'Counter', href: '/examples/counter' },
            { label: 'Todo', href: '/examples/todo' },
          ],
        },
        () => {},
      );
      const nav = el.props.nav as Array<{ href: string; active: boolean }>;
      expect(nav.find((n) => n.href === '/')?.active).toBe(false);
      expect(nav.find((n) => n.href === '/examples/counter')?.active).toBe(true);
      expect(nav.find((n) => n.href === '/examples/todo')?.active).toBe(false);
    });
  });
});
