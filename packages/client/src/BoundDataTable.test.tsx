import { expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BoundDataTable } from './BoundDataTable';

test('column menus, filter chips and clearing retain the server event payloads', async () => {
  const window = new Window({ url: 'http://localhost/' });
  const globals = { window, document: window.document, navigator: window.navigator,
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window), IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const container = window.document.createElement('div');
  window.document.body.append(container);
  const root = createRoot(container as unknown as HTMLElement);
  const events: unknown[][] = [];
  const columns = [{ key: 'symbol', header: 'Symbol' }, { key: 'status', header: 'Status', filter: 'facet', facetOptions: [{ value: 'done', label: 'Done' }] }];
  const props = { columns, rows: [], events: ['columnFilter', 'sort', 'columnPin', 'columnVisibility'],
    pageSize: 0, columnFilters: { symbol: 'abc', status: '["done"]' }, filterDebounceMs: 300 };
  const click = async (selector: string, event = {}) => {
    const element = container.querySelector(selector)!;
    expect(element).not.toBeNull();
    const key = Object.keys(element).find((key) => key.startsWith('__reactProps$'))!;
    await act(async () => { (element as any)[key].onClick(event); });
  };
  try {
    await act(async () => { root.render(<BoundDataTable id="table" props={props} style={undefined} emit={(...args) => events.push(args)} renderNode={() => null} />); });
    expect(container.querySelector('[aria-label="Symbol column menu"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Status column menu"]')).not.toBeNull();
    expect(container.textContent).toContain('Symbol: abc');
    expect(container.textContent).toContain('Status: Done');
    expect(container.querySelector('[aria-label="Status filter editor"]')).not.toBeNull();
    await click('[aria-label="Sort Symbol"]', { shiftKey: false });
    expect(events.pop()).toEqual(['table', 'sort', { key: 'symbol', dir: 'asc' }]);
    await click('[aria-label="Sort Symbol"]', { shiftKey: true });
    expect(events.pop()).toEqual(['table', 'sort', { key: 'symbol', multi: true }]);
    await click('[aria-label="Remove Symbol"]');
    expect(events.pop()).toEqual(['table', 'columnFilter', { key: 'symbol', value: '' }]);
    expect(container.textContent).not.toContain('Symbol: abc');
    // Unrelated live row patches resend a fresh map with the same server values.
    await act(async () => { root.render(<BoundDataTable id="table" props={{ ...props, columnFilters: { ...props.columnFilters }, rows: [{ id: 'live' }] }} style={undefined} emit={(...args) => events.push(args)} renderNode={() => null} />); });
    expect(container.textContent).not.toContain('Symbol: abc');
    // Both clears must emit immediately, even with the default debounce enabled.
    await act(async () => { root.render(<BoundDataTable id="table" props={{ ...props, columnFilters: { symbol: 'xyz', status: '["done"]' } }} style={undefined} emit={(...args) => events.push(args)} renderNode={() => null} />); });
    const clear = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Clear all')!;
    const key = Object.keys(clear).find((key) => key.startsWith('__reactProps$'))!;
    await act(async () => { (clear as any)[key].onClick(); });
    expect(events).toEqual([
      ['table', 'columnFilter', { key: 'symbol', value: '' }],
      ['table', 'columnFilter', { key: 'status', value: '' }],
    ]);
  } finally {
    await act(async () => root.unmount());
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    await window.happyDOM.close();
  }
});

test('tables with views expose the same toolbar filter picker', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = renderToStaticMarkup(<BoundDataTable id="views" props={{
    columns: [{ key: 'status', header: 'Status', filter: 'facet' }],
    rows: [], views: [{ id: 'outline', label: 'Outline' }], activeView: 'outline',
    searchable: false, exportable: false, columnToggle: false, pageSize: 0,
    events: ['columnFilter'],
  }} style={undefined} emit={() => {}} renderNode={() => null} />);
  expect(html).toContain(' Filter</button>');
  expect(html).toContain('Status column menu');
});

test('headers omit the menu when there are no supported actions', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = renderToStaticMarkup(<BoundDataTable id="plain" props={{
    columns: [{ key: 'status', header: 'Status' }], rows: [],
    columnFilterable: false, columnToggle: false, events: [], pageSize: 0,
  }} style={undefined} emit={() => {}} renderNode={() => null} />);
  expect(html).not.toContain('Status column menu');
  expect(html).toContain('Sort Status');
});
