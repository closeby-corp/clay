import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Controls',
  icon: 'sliders-horizontal',
  order: 86,
};

ui.page('/examples/controls', () => {
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

  const viewMode = ui.state({ value: 'list' });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'Menubar, command palette, carousel, resizable, scroll area, keybinds — plus ui.state / ui.auto.',
        );

        exampleSection('Menubar', 'ui.menubar — submenus, checkbox, and radio items.');
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

        exampleSection('Command palette', 'ui.command — dialog (⌘K-style) and inline list.');
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

        exampleSection('Carousel', 'ui.carousel with slides.');
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

        exampleSection('Resizable', 'ui.resizable — drag the handle between panels.');
        ui.resizable({ className: 'h-40' }, (r) => {
          r.panel({ defaultSize: 40, minSize: 20 }, () => {
            ui.label('Left panel').classes('text-sm text-muted-foreground');
          });
          r.handle();
          r.panel({ defaultSize: 60 }, () => {
            ui.label('Right panel').classes('text-sm text-muted-foreground');
          });
        });

        exampleSection('Scroll area', 'ui.scrollArea — clipped viewport with scrollbar.');
        ui.scrollArea({ className: 'h-32 w-72' }, () => {
          for (let i = 1; i <= 20; i++) {
            ui.label(`Row ${i}`).classes('text-sm');
          }
        });

        exampleSection(
          'Keybinds',
          'ui.keybind — headless chords (⌘/Ctrl+K opens the palette above; ⌘/Ctrl+S toasts).',
        );
        ui.keybind({
          keys: 'mod+k',
          onPress: () => palette.open(),
        });
        ui.keybind({
          keys: 'mod+s',
          onPress: () => ui.notify('Saved (keybind)', 'success'),
        });
        ui.label('Try ⌘K / Ctrl+K or ⌘S / Ctrl+S (ignored while typing in inputs).').classes(
          'text-sm text-muted-foreground',
        );

        exampleSection(
          'Reactive auto',
          'ui.state + ui.auto — rebuild when tracked reads change (MVP for compile-time let).',
        );
        const s = ui.state({ count: 0 });
        ui.auto(() => {
          ui.row(
            () => {
              ui.label(`Count: ${s.count}`).classes('text-sm tabular-nums');
              ui.button('+', {
                size: 'sm',
                onClick: () => {
                  s.count++;
                },
              });
              ui.button('Reset', {
                size: 'sm',
                variant: 'outline',
                onClick: () => {
                  s.count = 0;
                },
              });
            },
            { gap: 2 },
          );
        });
      },
      { gap: 6 },
    );
  });
});
