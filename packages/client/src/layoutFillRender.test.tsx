import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementRenderer } from './ElementRenderer';

const render = (type: string, props: Record<string, unknown>) =>
  renderToStaticMarkup(
    createElement(ElementRenderer, {
      emit: () => {},
      node: { id: `${type}-1`, type, props, children: [] },
    }),
  );

describe('layout fill rendering', () => {
  test('column grow + scroll', () => {
    const html = render('column', { grow: true, scroll: 'y' });
    expect(html).toContain('grow');
    expect(html).toContain('overflow-y-auto');
    expect(html).toContain('min-h-0');
  });

  test('numeric grow sets flex-grow', () => {
    expect(render('column', { grow: 3 })).toContain('flex-grow:3');
  });

  test('fillViewport uses the shell offset variable', () => {
    expect(render('column', { fillViewport: true })).toContain(
      'h-[calc(100svh-var(--clay-viewport-offset,0px))]',
    );
  });

  test('row that fills height stretches children unless align is set', () => {
    expect(render('row', { grow: true })).toContain('items-stretch');
    expect(render('row', { grow: true, align: 'start' })).toContain('items-start');
    expect(render('row', {})).toContain('items-center');
  });

  test('grid auto-fit and fixed cols', () => {
    expect(render('grid', { minColWidth: '14rem', gap: 4 })).toContain(
      'repeat(auto-fit, minmax(min(14rem, 100%), 1fr))',
    );
    const fixed = render('grid', { cols: 3, gap: 4 });
    expect(fixed).toContain('--clay-grid-cols:3');
    expect(fixed).toContain('grid-cols-1');
  });

  test('card scroll applies to content, grow to the card', () => {
    const html = render('card', { title: 'Inbox', grow: true, scroll: true, gap: 4 });
    expect(html).toMatch(/data-slot="card" class="[^"]*\bgrow\b/);
    expect(html).toMatch(/data-slot="card-content" class="[^"]*overflow-auto/);
  });
});
