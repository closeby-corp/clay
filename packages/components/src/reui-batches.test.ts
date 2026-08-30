import { describe, expect, test } from 'bun:test';
import {
  buttonGroup,
  empty,
  pagination,
  filterBar,
  filterChips,
  numberField,
  phoneInput,
  field,
  nativeSelect,
  navigationMenu,
  notice,
  eventCalendar,
  stat,
  inputGroup,
  toggleControl,
  descriptionList,
  staticTable,
  aspectRatio,
  itemList,
  checkboxGroup,
} from './index';

describe('ReUI batch components', () => {
  test('buttonGroup builds container', () => {
    const el = buttonGroup(() => {}, { orientation: 'horizontal' });
    expect(el.type).toBe('buttonGroup');
    expect(el.props.orientation).toBe('horizontal');
  });

  test('empty builds empty state', () => {
    const el = empty({ title: 'Nothing here', description: 'Add rows', icon: 'inbox' });
    expect(el.type).toBe('empty');
    expect(el.props.title).toBe('Nothing here');
    expect(el.props.icon).toBe('inbox');
  });

  test('pagination defaults', () => {
    const el = pagination({ page: 2, pageCount: 5 });
    expect(el.type).toBe('pagination');
    expect(el.props.page).toBe(2);
    expect(el.props.pageCount).toBe(5);
  });

  test('filterBar and filterChips', () => {
    const bar = filterBar({ chips: [{ id: 's', label: 'Status', value: 'open' }] }, () => {});
    expect(bar.type).toBe('filterBar');
    const chips = filterChips({ chips: [{ id: 's', label: 'Status', value: 'open' }] });
    expect(chips.type).toBe('filterChips');
  });

  test('numberField and phoneInput', () => {
    const num = numberField({ value: 3, min: 0, max: 10, step: 1 });
    expect(num.type).toBe('numberField');
    const phone = phoneInput({ country: 'US', value: '5551234' });
    expect(phone.type).toBe('phoneInput');
    expect(phone.props.country).toBe('US');
  });

  test('field and nativeSelect', () => {
    const f = field({ label: 'Email' }, () => {});
    expect(f.type).toBe('field');
    const sel = nativeSelect({
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      value: 'b',
    });
    expect(sel.type).toBe('nativeSelect');
    expect(sel.props.value).toBe('b');
  });

  test('navigationMenu builds menu tree', () => {
    const menu = navigationMenu((m) => {
      m.link('Home', { href: '/' });
      m.menu('Products', (sub) => {
        sub.link({ label: 'Analytics', href: '/analytics' });
      });
    });
    expect(menu.type).toBe('navigationmenu');
    expect(menu.children.length).toBe(2);
  });

  test('notice and eventCalendar', () => {
    const n = notice('Maintenance tonight', { variant: 'warning', dismissible: true });
    expect(n.type).toBe('notice');
    const cal = eventCalendar({
      selected: '2026-08-30',
      events: [{ id: '1', date: '2026-08-30', title: 'Standup' }],
    });
    expect(cal.type).toBe('eventCalendar');
    expect((cal.props.items as unknown[]).length).toBe(1);
  });

  test('eventCalendar stores items on wire (not protocol events key)', () => {
    const cal = eventCalendar({
      events: [{ id: '1', date: '2026-08-30', title: 'Standup' }],
      onSelect: () => {},
    });
    expect((cal.props.items as unknown[]).length).toBe(1);
    expect(cal.props.events).toContain('select');
  });

  test('stat accepts sparkline on items', () => {
    const el = stat([
      {
        title: 'MRR',
        value: '$12k',
        trend: '+8%',
        sparkline: {
          data: [{ d: '1', v: 1 }],
          xKey: 'd',
          yKey: 'v',
        },
      },
    ]);
    expect(el.type).toBe('stat');
    const items = el.props.items as Array<{ sparkline?: unknown }>;
    expect(items[0]?.sparkline).toBeDefined();
  });

  test('batch 7 factories', () => {
    expect(inputGroup({ prefix: '$' }).type).toBe('inputGroup');
    expect(toggleControl({ pressed: true, icon: 'pin' }).type).toBe('toggle');
    expect(
      descriptionList({ items: [{ term: 'A', detail: 'B' }] }).type,
    ).toBe('descriptionList');
    expect(
      staticTable({ columns: [{ key: 'a', label: 'A' }], rows: [{ a: '1' }] }).type,
    ).toBe('staticTable');
    const ar = aspectRatio(() => {}, { ratio: 1 });
    expect(ar.type).toBe('aspectRatio');
    expect(itemList({ items: [{ title: 'Hi' }] }).type).toBe('itemList');
    expect(
      checkboxGroup({ options: [{ value: 'a', label: 'A' }], value: ['a'] }).type,
    ).toBe('checkboxGroup');
  });
});
