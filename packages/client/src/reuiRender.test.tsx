import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementRenderer } from './ElementRenderer';

const emit = () => {};

describe('ReUI client render smoke', () => {
  test('notice renders message text', () => {
    const html = renderToStaticMarkup(
      <ElementRenderer
        emit={emit}
        node={{
          id: 'notice-1',
          type: 'notice',
          props: {
            text: 'Maintenance tonight',
            variant: 'warning',
            icon: 'triangle-alert',
            dismissible: true,
            events: ['dismiss'],
          },
          children: [],
        }}
      />,
    );
    expect(html).toContain('Maintenance tonight');
  });

  test('pagination renders page links', () => {
    const html = renderToStaticMarkup(
      <ElementRenderer
        emit={emit}
        node={{
          id: 'page-1',
          type: 'pagination',
          props: { page: 2, pageCount: 5, events: ['change'] },
          children: [],
        }}
      />,
    );
    expect(html).toContain('pagination');
    expect(html).toMatch(/>\s*2\s*</);
  });

  test('numberField renders stepper input', () => {
    const html = renderToStaticMarkup(
      <ElementRenderer
        emit={emit}
        node={{
          id: 'num-1',
          type: 'numberField',
          props: { value: 3, label: 'Qty', events: ['change'] },
          children: [],
        }}
      />,
    );
    expect(html).toContain('Qty');
    expect(html).toContain('type="number"');
  });

  test('eventCalendar renders calendar items', () => {
    const html = renderToStaticMarkup(
      <ElementRenderer
        emit={emit}
        node={{
          id: 'cal-1',
          type: 'eventCalendar',
          props: {
            selected: '2026-08-30',
            items: [{ id: '1', date: '2026-08-30', title: 'Ship it' }],
            events: ['select'],
          },
          children: [],
        }}
      />,
    );
    expect(html).toContain('Ship it');
  });

  test('navigationmenu renders top-level links', () => {
    const html = renderToStaticMarkup(
      <ElementRenderer
        emit={emit}
        node={{
          id: 'nav-1',
          type: 'navigationmenu',
          props: {},
          children: [
            {
              id: 'nav-link-1',
              type: 'navigationmenulink',
              props: { label: 'Overview', href: '#' },
              children: [],
            },
          ],
        }}
      />,
    );
    expect(html).toContain('Overview');
  });
});
