import { describe, expect, test } from 'bun:test';
import { dropdownMenu, DropdownMenuElement } from './dropdown-menu';

describe('DropdownMenuElement', () => {
  test('factory builds items and separators', () => {
    const menu = dropdownMenu({ label: 'Actions' }, (m) => {
      m.item('edit', 'Edit');
      m.separator();
      m.item('delete', 'Delete', { variant: 'destructive' });
    });
    expect(menu).toBeInstanceOf(DropdownMenuElement);
    expect(menu.type).toBe('dropdownmenu');
    expect(menu.props.label).toBe('Actions');
    expect(menu.children.map((c) => c.type)).toEqual([
      'dropdownitem',
      'dropdownseparator',
      'dropdownitem',
    ]);
    expect(menu.children[2]?.props.variant).toBe('destructive');
    expect(menu.children[0]?.props.events).toBeUndefined();
  });

  test('item onSelect registers select event', () => {
    const menu = dropdownMenu((m) => {
      m.item('x', 'X', { onSelect: () => {} });
    });
    expect(menu.children[0]?.props.events).toEqual(expect.arrayContaining(['select']));
  });
});
