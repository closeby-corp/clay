import { afterEach, expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BoundDataTable } from './BoundDataTable';
import { FilterChipsView } from './FilterChipsView';
import { __setI18nBootForTests } from './i18n';

afterEach(() => __setI18nBootForTests());

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

test('view tab count badges grow to fit 1, 3 and 4-digit counts', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = renderToStaticMarkup(<BoundDataTable id="counts" props={{
    columns: [{ key: 'name', header: 'Name' }], rows: [],
    views: [{ id: 'one', label: 'One', count: 6 }, { id: 'three', label: 'Three', count: 389 }, { id: 'four', label: 'Four', count: 1234 }],
    activeView: 'one', searchable: false, exportable: false, columnToggle: false, pageSize: 0, events: [],
  }} style={undefined} emit={() => {}} renderNode={() => null} />);
  const badges = [...html.matchAll(/<span([^>]*data-view-count=""[^>]*)>([^<]*)<\/span>/g)]
    .map(([, attrs, text]) => [attrs!.match(/class="([^"]*)"/)![1], text]);
  expect(badges.map(([, text]) => text)).toEqual(['6', '389', '1234']);
  for (const [cls] of badges) {
    const classes = cls!.split(/\s+/);
    expect(classes).toContain('min-w-5');
    expect(classes).toContain('w-fit');
    expect(classes).toContain('tabular-nums');
    expect(classes).not.toContain('w-5');
  }
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

test('toolbar, pager, empty state and formatted cells follow the pt-PT locale', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const columns = [{ key: 'name', header: 'Nome' }, { key: 'amount', header: 'Valor', format: 'number' }];
  const render = (rows: Record<string, unknown>[], extra: Record<string, unknown> = {}) => renderToStaticMarkup(
    <BoundDataTable id="pt" props={{ columns, rows, page: 1, pageSize: 10, totalPages: 1, groupBy: 'name', ...extra }}
      style={undefined} emit={() => {}} renderNode={() => null} />);

  // English stays the default.
  const en = render([{ id: 1, name: 'a', amount: 1234567.5 }]);
  expect(en).toContain('placeholder="Search…"');
  expect(en).toContain('Rows per page');
  expect(en).toContain('1,234,567.5');

  __setI18nBootForTests({ locale: 'pt-PT' });
  const empty = render([]);
  for (const text of ['placeholder="Pesquisar…"', 'Exportar', 'Personalizar colunas', 'Recolher tudo', 'Expandir tudo',
    ' Filtrar</button>', 'Linhas por página', 'Página 1 de 1', 'A mostrar 0–0 de 0', 'Ir para a página seguinte',
    'Sem linhas', 'Tente ajustar a pesquisa ou os filtros.']) {
    expect(empty).toContain(text);
  }
  expect(empty).not.toContain('Rows per page');
  const rows = render([{ id: 1, name: 'a', amount: 1234567.5 }], { selectable: true, totalRows: 1 });
  expect(rows).toContain('1\u00a0234\u00a0567,5');
  expect(rows).toContain('0 de 1 linha selecionada.');
  expect(rows).toContain('aria-label="Menu da coluna Nome"');
  // A server-pinned format locale still wins over the UI locale.
  const pinned = render([{ id: 1, name: 'a', amount: 1234567.5 }],
    { columns: [{ key: 'amount', header: 'Valor', format: 'number', formatOptions: { locale: 'en-US' } }] });
  expect(pinned).toContain('1,234,567.5');
});

test('filter chips translate their built-in labels in pt-PT', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  __setI18nBootForTests({ locale: 'pt-PT' });
  const html = renderToStaticMarkup(<FilterChipsView chips={[{ id: 's', label: 'Estado', value: 'Ativo' }]}
    onClear={() => {}} onRemoveChip={() => {}} />);
  expect(html).toContain('aria-label="Remover Estado"');
  expect(html).toContain('Limpar tudo');
});
