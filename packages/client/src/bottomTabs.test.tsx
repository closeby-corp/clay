import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementRenderer } from './ElementRenderer';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

function setPhone(matches: boolean) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: { location: { href: 'http://localhost/' }, matchMedia: () => ({ matches, addEventListener() {}, removeEventListener() {} }) },
  });
}

const item = (n: number, active = false) => ({ label: `Page ${n}`, href: `/p${n}`, active });

function renderApp(props: Record<string, unknown>) {
  return renderToStaticMarkup(createElement(ElementRenderer, {
    emit: () => {},
    node: { id: 'app-1', type: 'app', props: { title: 'Clay', ...props }, children: [] },
  }));
}

describe('phone bottom tab bar', () => {
  test('renders tabs with active state and no More for <=4 items', () => {
    setPhone(true);
    const html = renderApp({ nav: [item(1, true), item(2)] });
    expect(html).toContain('data-clay-tabbar');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Page 2');
    expect(html).not.toContain('More');
  });

  test('caps at 4 tabs and adds More for extra items', () => {
    setPhone(true);
    const html = renderApp({ nav: [1, 2, 3, 4, 5].map((n) => item(n)) });
    expect(html).toContain('More');
    expect(html).not.toMatch(/data-clay-tabbar[\s\S]*Page 5[\s\S]*<\/nav>/);
  });

  test('More appears for secondary nav or user', () => {
    setPhone(true);
    expect(renderApp({ nav: [item(1)], user: { name: 'A', email: 'a@b.c' } })).toContain('More');
    expect(renderApp({ nav: [item(1)], navSecondary: [item(2)] })).toContain('More');
  });

  test('tab is current when a nested child page is active', () => {
    setPhone(true);
    const html = renderApp({ nav: [item(1), { ...item(2), items: [{ label: 'Child', href: '/p2/child', active: true }] }] });
    const bar = html.slice(html.indexOf('data-clay-tabbar'));
    expect(bar).toMatch(/href="\/p2" aria-current="page"/);
    expect(bar).not.toMatch(/href="\/p1" aria-current/);
  });

  test('not rendered off phones or with mobileNav menu', () => {
    setPhone(false);
    expect(renderApp({ nav: [item(1)] })).not.toContain('data-clay-tabbar');
    setPhone(true);
    expect(renderApp({ nav: [item(1)], mobileNav: 'menu' })).not.toContain('data-clay-tabbar');
  });
});
