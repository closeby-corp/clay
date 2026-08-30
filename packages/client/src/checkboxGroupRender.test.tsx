import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementRenderer } from './ElementRenderer';

describe('BoundCheckboxGroup optimistic value', () => {
  test('renders without infinite update when value is an array', () => {
    const html = renderToStaticMarkup(
      createElement(ElementRenderer, {
        emit: () => {},
        node: {
          id: 'cbg-1',
          type: 'checkboxGroup',
          props: {
            label: 'Permissions',
            value: ['read', 'write'],
            options: [
              { value: 'read', label: 'Read' },
              { value: 'write', label: 'Write' },
              { value: 'admin', label: 'Admin' },
            ],
          },
          children: [],
        },
      }),
    );
    expect(html).toContain('Permissions');
    expect(html).toContain('Read');
  });
});
