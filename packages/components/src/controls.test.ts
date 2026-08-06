import { describe, expect, test } from 'bun:test';
import {
  menubar,
  MenubarElement,
  carousel,
  CarouselElement,
  command,
  CommandElement,
  resizable,
  ResizableElement,
  scrollArea,
} from './index';

describe('menubar', () => {
  test('factory builds menus, items, separators', () => {
    const bar = menubar((m) => {
      m.menu('File', (menu) => {
        menu.item('new', 'New');
        menu.separator();
        menu.item('quit', 'Quit', { variant: 'destructive' });
      });
      m.menu('Edit', (menu) => {
        menu.item('copy', 'Copy', { onSelect: () => {} });
      });
    });
    expect(bar).toBeInstanceOf(MenubarElement);
    expect(bar.type).toBe('menubar');
    expect(bar.children).toHaveLength(2);
    expect(bar.children[0]?.type).toBe('menubarmenu');
    expect(bar.children[0]?.props.label).toBe('File');
    expect(bar.children[0]?.children.map((c) => c.type)).toEqual([
      'menubaritem',
      'menubarseparator',
      'menubaritem',
    ]);
    expect(bar.children[1]?.children[0]?.props.events).toEqual(
      expect.arrayContaining(['select']),
    );
  });

  test('submenu, checkbox, and radio group', async () => {
    let checked = true;
    const bar = menubar((m) => {
      m.menu('View', (menu) => {
        menu.checkbox('sidebar', 'Sidebar', {
          checked: true,
          onCheckedChange: (v) => {
            checked = v;
          },
        });
        menu.separator();
        menu.radioGroup({ value: 'list' }, (g) => {
          g.item('list', 'List');
          g.item('grid', 'Grid');
        });
        menu.submenu('Share', (sub) => {
          sub.item('email', 'Email', { onSelect: () => {} });
          sub.checkbox('link', 'Copy link');
        });
      });
    });

    const viewMenu = bar.children[0]!;
    expect(viewMenu.children.map((c) => c.type)).toEqual([
      'menubarcheckbox',
      'menubarseparator',
      'menubarradiogroup',
      'menubarsubmenu',
    ]);

    const cb = viewMenu.children[0]!;
    expect(cb.props.checked).toBe(true);
    expect(cb.props.events).toEqual(expect.arrayContaining(['checkedChange']));
    await cb.handleEvent('checkedChange', false);
    expect(cb.props.checked).toBe(false);
    expect(checked).toBe(false);

    const rg = viewMenu.children[2]!;
    expect(rg.props.value).toBe('list');
    expect(rg.children.map((c) => c.type)).toEqual(['menubarradioitem', 'menubarradioitem']);
    await rg.handleEvent('valueChange', 'grid');
    expect(rg.props.value).toBe('grid');

    const sub = viewMenu.children[3]!;
    expect(sub.type).toBe('menubarsubmenu');
    expect(sub.props.label).toBe('Share');
    expect(sub.children.map((c) => c.type)).toEqual(['menubaritem', 'menubarcheckbox']);
  });
});

describe('carousel', () => {
  test('factory builds slides', () => {
    const el = carousel({ orientation: 'vertical', controls: false }, (c) => {
      c.slide(() => {});
      c.slide(() => {});
    });
    expect(el).toBeInstanceOf(CarouselElement);
    expect(el.type).toBe('carousel');
    expect(el.props.orientation).toBe('vertical');
    expect(el.props.controls).toBe(false);
    expect(el.children.map((c) => c.type)).toEqual(['carouselslide', 'carouselslide']);
  });
});

describe('command', () => {
  test('open/close and groups', async () => {
    const el = command({ open: false, placeholder: 'Search…' }, (c) => {
      c.group('Nav', (g) => {
        g.item('home', 'Home', { onSelect: () => {} });
      });
      c.separator();
      c.group('Other', (g) => {
        g.item('x', 'X', { shortcut: '⌘K' });
      });
    });
    expect(el).toBeInstanceOf(CommandElement);
    expect(el.type).toBe('command');
    expect(el.props.mode).toBe('dialog');
    expect(el.props.open).toBe(false);
    expect(el.props.events).toEqual(expect.arrayContaining(['openChange']));
    el.open();
    expect(el.props.open).toBe(true);
    el.close();
    expect(el.props.open).toBe(false);
    expect(el.children.map((c) => c.type)).toEqual([
      'commandgroup',
      'commandseparator',
      'commandgroup',
    ]);
    expect(el.children[0]?.children[0]?.props.events).toEqual(
      expect.arrayContaining(['select']),
    );
  });

  test('inline mode skips dialog open state', () => {
    const el = command({ mode: 'inline', placeholder: 'Filter…' }, (c) => {
      c.group('Actions', (g) => {
        g.item('run', 'Run');
      });
    });
    expect(el.props.mode).toBe('inline');
    expect(el.props.open).toBe(true);
    expect(el.props.events ?? []).not.toEqual(expect.arrayContaining(['openChange']));
    el.close();
    expect(el.props.open).toBe(true);
  });
});

describe('resizable', () => {
  test('factory builds panels and handle', () => {
    const el = resizable({ orientation: 'vertical' }, (r) => {
      r.panel({ defaultSize: 30, minSize: 10 }, () => {});
      r.handle({ withHandle: true });
      r.panel(() => {}, { defaultSize: 70 });
    });
    expect(el).toBeInstanceOf(ResizableElement);
    expect(el.type).toBe('resizable');
    expect(el.props.orientation).toBe('vertical');
    expect(el.children.map((c) => c.type)).toEqual([
      'resizablepanel',
      'resizablehandle',
      'resizablepanel',
    ]);
    expect(el.children[0]?.props.defaultSize).toBe(30);
    expect(el.children[1]?.props.withHandle).toBe(true);
  });
});

describe('scrollArea', () => {
  test('factory wraps children', () => {
    const el = scrollArea({ className: 'h-32' }, () => {});
    expect(el.type).toBe('scrollarea');
    expect(el.props.className).toBe('h-32');
  });
});
