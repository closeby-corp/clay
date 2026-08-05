import { describe, expect, test } from 'bun:test';
import { SheetElement, sheet } from './sheet';
import { DrawerElement, drawer } from './drawer';

describe('SheetElement', () => {
  test('open/close/setOpen flip props.open', () => {
    const el = new SheetElement({ title: 'Filters', side: 'left', open: false });
    expect(el.props.open).toBe(false);
    expect(el.props.side).toBe('left');

    el.open();
    expect(el.props.open).toBe(true);

    el.close();
    expect(el.props.open).toBe(false);
  });

  test('handleEvent close sets open false', async () => {
    const el = new SheetElement({ open: true });
    await el.handleEvent('close');
    expect(el.props.open).toBe(false);
  });

  test('factory builds children and exposes close event', () => {
    const el = sheet({ title: 'Hi', open: false }, (s) => {
      void s;
    });
    expect(el.type).toBe('sheet');
    expect(el.props.title).toBe('Hi');
    expect(el.props.side).toBe('right');
    expect(el.props.events).toEqual(expect.arrayContaining(['close']));
  });
});

describe('DrawerElement', () => {
  test('open/close and direction', () => {
    const el = new DrawerElement({ title: 'Menu', direction: 'right', open: false });
    expect(el.props.direction).toBe('right');
    el.open();
    expect(el.props.open).toBe(true);
    el.close();
    expect(el.props.open).toBe(false);
  });

  test('factory and close event', async () => {
    let closed = false;
    const el = drawer(
      {
        title: 'Drawer',
        onClose: () => {
          closed = true;
        },
      },
      () => {},
    );
    expect(el).toBeInstanceOf(DrawerElement);
    expect(el.type).toBe('drawer');
    expect(el.props.events).toEqual(expect.arrayContaining(['close']));
    el.setOpen(true);
    await el.handleEvent('close');
    expect(closed).toBe(true);
    expect(el.props.open).toBe(false);
  });
});
