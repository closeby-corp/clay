import { describe, expect, test } from 'bun:test';
import { ClientSession, runWithSession, type ServerMessage } from '@close-by/clay-core';
import { DataTableElement, normalizeTableData } from './data-table';
import { CommandElement } from './command';
import { dateRange } from './date-range';
import { filterBar, filterChips } from './filter-bar';
import { selectionActions } from './ai/selection-actions';
import { combobox, date, phoneInput } from './index';

function inLocale<T>(locale: string, fn: (session: ClientSession) => T, send: (m: ServerMessage) => void = () => {}): T {
  const session = new ClientSession('/i18n', send);
  session.locale = locale;
  return runWithSession(session, () => fn(session));
}

describe('server-built English defaults', () => {
  test('props with a translated client fallback are left unset', () => {
    expect(date().props.placeholder).toBeUndefined();
    expect(dateRange().props.placeholder).toBeUndefined();
    expect(combobox({ options: [{ value: 'a', label: 'A' }] }).props.placeholder).toBeUndefined();
    expect(phoneInput().props.placeholder).toBeUndefined();
    expect(filterBar({}, () => {}).props.clearLabel).toBeUndefined();
    expect(filterChips({ chips: [] }).props.clearLabel).toBeUndefined();
    const cmd = new CommandElement();
    expect([cmd.props.title, cmd.props.description, cmd.props.placeholder, cmd.props.emptyText]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    const table = new DataTableElement([{ a: 1 }], {});
    expect(table.props.searchPlaceholder).toBeUndefined();
    expect(table.props.emptyTitle).toBeUndefined();
    expect(table.props.emptyDescription).toBeUndefined();
    // Explicit values still win.
    expect(date({ placeholder: 'When?' }).props.placeholder).toBe('When?');
    expect(new DataTableElement([], { emptyTitle: 'Nada' }).props.emptyTitle).toBe('Nada');
  });

  test('English stays the default for build-time strings', () => {
    expect(normalizeTableData({ a: 1 }).inferredColumns.map((c) => c.header)).toEqual(['Key', 'Value']);
    expect((selectionActions({ selection: 'x' }).props.actions as { label: string }[])[0]!.label).toBe('Explain');
    const countries = phoneInput().props.countries as { code: string; label: string }[];
    expect(countries.find((c) => c.code === 'GB')!.label).toBe('United Kingdom');
  });

  test('build-time strings follow the session locale (pt-PT)', () => {
    inLocale('pt-PT', () => {
      expect(normalizeTableData({ a: 1 }).inferredColumns.map((c) => c.header)).toEqual(['Chave', 'Valor']);
      expect(normalizeTableData([1]).inferredColumns[0]!.header).toBe('Valor');
      const actions = selectionActions({ selection: 'x' }).props.actions as { label: string }[];
      expect(actions.map((a) => a.label)).toEqual(['Explicar', 'Melhorar', 'Encurtar', 'Tom', 'Gramática']);
      const countries = phoneInput().props.countries as { code: string; label: string }[];
      expect(countries.find((c) => c.code === 'DE')!.label).toBe('Alemanha');
    });
  });

  test('data table empty group label and export notices use the table session locale', async () => {
    const messages: ServerMessage[] = [];
    const table = inLocale(
      'pt-PT',
      () =>
        new DataTableElement(
          [
            { id: 1, status: 'done' },
            { id: 2, status: '' },
          ],
          { columns: [{ key: 'status', header: 'Estado' }], groupBy: 'status', pageSize: 10 },
        ),
      (m) => messages.push(m),
    );
    const groups = table.props.groups as { key: string; label: string }[];
    expect(groups.find((g) => g.key === '')!.label).toBe('(Vazio)');

    // Triggered outside any session (timer / live data): still the table's locale.
    table.setRows([{ id: 3, status: '' }]);
    expect((table.props.groups as { label: string }[])[0]!.label).toBe('(Vazio)');

    await table.handleEvent('export', { format: 'csv', mode: 'copy' });
    const toast = messages.find((m) => m.op === 'notify') as { message?: string } | undefined;
    expect(toast?.message).toBe('CSV copiado para a área de transferência');
  });
});
