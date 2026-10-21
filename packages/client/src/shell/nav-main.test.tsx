import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavMain, navGroupStateReducer } from './nav-main';
import type { ShellNavItem } from './types';

describe('NavMain', () => {
  test('renders nested groups recursively with button toggles and leaf links', () => {
    const items: ShellNavItem[] = [
      {
        label: 'Workspace',
        href: '/workspace/users',
        icon: 'folder',
        active: true,
        items: [
          {
            label: 'Users',
            href: '/workspace/users',
            icon: 'users',
            active: true,
            items: [
              {
                label: 'Alice',
                href: '/workspace/users/alice',
                icon: 'user-round',
                active: true,
              },
            ],
          },
        ],
      },
    ];
    const html = renderToStaticMarkup(
      <SidebarProvider>
        <NavMain items={items} />
      </SidebarProvider>,
    );

    expect(html).toContain('Workspace');
    expect(html).toContain('Users');
    expect(html).toContain('Alice');
    expect(html).toContain('href="/workspace/users/alice"');
    expect(html).toContain('lucide-folder');
    expect(html).toContain('lucide-users');
    expect(html).toContain('lucide-user-round');
    expect(html.match(/aria-expanded="true"/g)?.length).toBe(2);

    const nestedTrigger = html.match(
      /<button(?=[^>]*data-sidebar="menu-sub-button")(?=[^>]*aria-expanded="true")[^>]*>/,
    )?.[0];
    expect(nestedTrigger).toContain('type="button"');
    expect(nestedTrigger).not.toContain('href=');
  });

  test('rotates each nested group chevron from its own open state', () => {
    const items: ShellNavItem[] = [
      {
        label: 'Workspace',
        href: '/workspace',
        icon: 'folder',
        active: true,
        items: [
          {
            label: 'Reports',
            href: '/workspace/reports',
            icon: 'folder',
            items: [
              {
                label: 'Monthly',
                href: '/workspace/reports/monthly',
                icon: 'file',
              },
            ],
          },
        ],
      },
    ];
    const html = renderToStaticMarkup(
      <SidebarProvider>
        <NavMain items={items} />
      </SidebarProvider>,
    );

    const expandedGroup = html.match(
      /<button\b(?=[^>]*aria-expanded="true")[^>]*>[\s\S]*?<\/button>/,
    )?.[0];
    const collapsedGroup = html.match(
      /<button\b(?=[^>]*aria-expanded="false")[^>]*>[\s\S]*?<\/button>/,
    )?.[0];

    expect(expandedGroup).toContain('rotate-90');
    expect(collapsedGroup).not.toContain('rotate-90');
  });
});

describe('navGroupStateReducer', () => {
  test('reopens for a changed active destination but preserves manual toggles otherwise', () => {
    const initial = { open: true, destination: '/reports/open' };
    const closed = navGroupStateReducer(initial, { type: 'openChanged', open: false });

    const sameDestination = navGroupStateReducer(closed, {
      type: 'destinationChanged',
      destination: '/reports/open',
    });
    expect(sameDestination.open).toBe(false);

    const nextChild = navGroupStateReducer(sameDestination, {
      type: 'destinationChanged',
      destination: '/reports/closed',
    });
    expect(nextChild.open).toBe(true);

    const closedAgain = navGroupStateReducer(nextChild, {
      type: 'openChanged',
      open: false,
    });
    const away = navGroupStateReducer(closedAgain, {
      type: 'destinationChanged',
      destination: undefined,
    });
    expect(away.open).toBe(false);

    const returnToPreviouslyClosedGroup = navGroupStateReducer(away, {
      type: 'destinationChanged',
      destination: '/reports/open',
    });
    expect(returnToPreviouslyClosedGroup.open).toBe(true);
  });
});
