import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementRenderer } from './ElementRenderer';
import type { ElementNode } from './protocol';

function renderApp(props: Record<string, unknown>): string {
  const node: ElementNode = {
    id: 'app-1',
    type: 'app',
    props,
    children: [],
  };
  return renderToStaticMarkup(<ElementRenderer emit={() => {}} node={node} />);
}

describe('app shell heading render', () => {
  test('uses the active nav label when headerTitle is omitted', () => {
    const html = renderApp({
      title: 'Clay',
      nav: [{ label: 'Reports', href: '/reports', active: true }],
    });

    expect(html).toContain('<h1 class="text-base font-medium">Reports</h1>');
  });

  test('uses the brand when headerTitle and active nav are omitted', () => {
    const html = renderApp({ title: 'My App', nav: [] });

    expect(html).toContain('<h1 class="text-base font-medium">My App</h1>');
  });

  test('preserves an explicitly empty headerTitle', () => {
    const html = renderApp({
      title: 'Clay',
      headerTitle: '',
      nav: [{ label: 'Reports', href: '/reports', active: true }],
    });

    expect(html).toContain('<h1 class="text-base font-medium"></h1>');
  });
});
