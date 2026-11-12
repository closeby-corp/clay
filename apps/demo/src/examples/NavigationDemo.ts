import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Navigation & layout',
  icon: 'sliders-horizontal',
  order: 51,
  group: 'Components',
  groupIcon: 'component',
};

ui.page('/examples/navigation', () => {
  const palette = ui.command({ open: false, placeholder: 'Jump to…' }, (c) => {
    c.group('Navigation', (g) => {
      g.item('home', 'Home', {
        shortcut: '⌘H',
        onSelect: () => ui.notify('Home', 'info'),
      });
      g.item('overlays', 'Overlays', {
        onSelect: () => ui.navigate('/examples/overlays'),
      });
    });
    c.separator();
    c.group('Actions', (g) => {
      g.item('toast', 'Show toast', {
        onSelect: () => ui.notify('Command ran', 'success'),
      });
    });
  });

  const page = ui.state({ n: 2 });
  const view = ui.state({ mode: 'list' as 'list' | 'grid' | 'board' });

  const viewMode = ui.state({ value: 'list' });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'Explore menus, keyboard shortcuts, and flexible page layouts.',
        );

        exampleSection('Menubar', 'Browse menus, choose options, and toggle preferences.');
        ui.menubar((m) => {
          m.menu('File', (menu) => {
            menu.item('new', 'New', { onSelect: () => ui.notify('New', 'info') });
            menu.separator();
            menu.item('quit', 'Quit', {
              variant: 'destructive',
              onSelect: () => ui.notify('Quit', 'warning'),
            });
          });
          m.menu('Edit', (menu) => {
            menu.item('copy', 'Copy', { onSelect: () => ui.notify('Copy', 'info') });
            menu.item('paste', 'Paste', { onSelect: () => ui.notify('Paste', 'info') });
            menu.submenu('Find', (sub) => {
              sub.item('find', 'Find…', { onSelect: () => ui.notify('Find', 'info') });
              sub.item('replace', 'Replace…', { onSelect: () => ui.notify('Replace', 'info') });
            });
          });
          m.menu('View', (menu) => {
            menu.checkbox('sidebar', 'Sidebar', {
              checked: true,
              onCheckedChange: (v) => ui.notify(`Sidebar ${v ? 'on' : 'off'}`, 'info'),
            });
            menu.separator();
            menu.radioGroup(
              {
                value: viewMode.value,
                onValueChange: (v) => {
                  viewMode.value = v;
                  ui.notify(`View: ${v}`, 'info');
                },
              },
              (g) => {
                g.item('list', 'List');
                g.item('grid', 'Grid');
              },
            );
          });
        });

        exampleSection('Command palette', 'Find an action in a searchable popup or inline list.');
        ui.button('Open command palette', {
          variant: 'outline',
          onClick: () => palette.open(),
        });
        ui.command(
          { mode: 'inline', placeholder: 'Filter actions…', className: 'max-w-md' },
          (c) => {
            c.group('Quick actions', (g) => {
              g.item('notify', 'Show toast', {
                onSelect: () => ui.notify('Inline command', 'success'),
              });
              g.item('home', 'Go home', {
                shortcut: '⌘H',
                onSelect: () => ui.navigate('/'),
              });
            });
          },
        );

        exampleSection('Carousel', 'Browse slides with the navigation controls.');
        ui.carousel((c) => {
          c.slide(() => {
            ui.label('Slide one').classes('text-sm font-medium');
          });
          c.slide(() => {
            ui.label('Slide two').classes('text-sm font-medium');
          });
          c.slide(() => {
            ui.label('Slide three').classes('text-sm font-medium');
          });
        });

        exampleSection('Resizable', 'Drag the handle to resize the panels.');
        ui.resizable({ className: 'h-40' }, (r) => {
          r.panel({ defaultSize: 40, minSize: 20 }, () => {
            ui.label('Left panel').classes('text-sm text-muted-foreground');
          });
          r.handle();
          r.panel({ defaultSize: 60 }, () => {
            ui.label('Right panel').classes('text-sm text-muted-foreground');
          });
        });

        exampleSection(
          'Scroll area',
          'Scroll to the bottom to load more items.',
        );
        const scrollRows = ui.state({ n: 20 });
        ui.auto(() => {
          ui.scrollArea(
            {
              className: 'h-32 w-72',
              nearEndThreshold: 48,
              onNearEnd: () => {
                scrollRows.n += 10;
                ui.notify(`Loaded more — ${scrollRows.n} rows`, 'info');
              },
            },
            () => {
              for (let i = 1; i <= scrollRows.n; i++) {
                ui.label(`Row ${i}`).classes('block text-sm');
              }
            },
          );
        });

        exampleSection(
          'Viewport enter',
          'Scroll down to reveal content when it enters view.',
        );
        ui.column({ className: 'gap-2 min-h-[28rem]' }, () => {
          ui.label('Scroll the page so the box below enters the viewport.').classes(
            'text-sm text-muted-foreground',
          );
          ui.viewportEnter(
            {
              once: true,
              rootMargin: '0px',
              onEnter: () => ui.notify('Section entered viewport', 'success'),
            },
            () => {
              ui.card({ title: 'Lazy section', className: 'max-w-md' }, () => {
                ui.label('This fired onEnter the first time it became visible.').classes(
                  'text-xs text-muted-foreground',
                );
              });
            },
          );
        });

        exampleSection(
          'Keybinds',
          'Use keyboard shortcuts to trigger actions.',
        );
        ui.keybind({
          keys: 'mod+k',
          onPress: () => palette.open(),
        });
        ui.keybind({
          keys: 'mod+s',
          onPress: () => ui.notify('Saved (keybind)', 'success'),
        });
        ui.row({ className: 'items-center gap-2 flex-wrap' }, () => {
          ui.label('Try').classes('text-sm text-muted-foreground');
          ui.kbd('mod+k');
          ui.label('or').classes('text-sm text-muted-foreground');
          ui.kbd('mod+s');
          ui.label('(ignored while typing in inputs).').classes('text-sm text-muted-foreground');
        });


        exampleSection('Navigation menu', 'Browse pages through links and a dropdown menu.');
        ui.card({ className: 'overflow-visible p-4' }, () => {
          ui.navigationMenu((menu) => {
            menu.link('Overview', { href: '/examples/dashboard', active: true });
            menu.menu('Product', (sub) => {
              sub.link({
                label: 'Analytics',
                description: 'Charts and KPIs',
                href: '/examples/charts',
              });
              sub.link({
                label: 'Data table',
                description: 'Grid + filter chips',
                href: '/examples/datatable',
              });
            });
            menu.link('Docs', {
              onSelect: () => ui.notify('Docs clicked', 'info'),
            });
          });
        });

        exampleSection('Button group', 'Switch between list, grid, and board views.');
        ui.auto(() => {
          ui.buttonGroup(() => {
            for (const mode of ['list', 'grid', 'board'] as const) {
              ui.button(mode, {
                size: 'sm',
                variant: 'outline',
                className: view.mode === mode ? 'bg-accent' : undefined,
                onClick: () => {
                  view.mode = mode;
                },
              });
            }
          });
          ui.label(() => `View: ${view.mode}`).classes('text-sm text-muted-foreground');
        });

        exampleSection('Pagination', 'Move between pages with numbered and previous or next buttons.');
        ui.auto(() => {
          ui.card({ className: 'p-4' }, () => {
            ui.pagination({
              page: page.n,
              pageCount: 8,
              onChange: (n) => {
                page.n = n;
              },
            });
          });
          ui.label(() => `Page ${page.n} of 8`).classes('text-sm text-muted-foreground');
        });

        exampleSection('Aspect ratio', 'Keep a media tile at a consistent width and height ratio.');
        ui.aspectRatio({ ratio: 16 / 9, className: 'max-w-md' }, () => {
          ui.card({ className: 'flex h-full items-center justify-center border-0 shadow-none' }, () => {
            ui.label('16:9 tile').classes('text-muted-foreground');
          });
        });
      },
      { gap: 6 },
    );
  });
});
