import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Overlays',
  icon: 'layout-dashboard',
  order: 50,
  group: 'Components',
  groupIcon: 'component',
};

ui.page('/examples/overlays', () => {
  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'Explore menus, contextual details, and dialogs for focused tasks.',
        );

        exampleSection('Breadcrumb', 'ui.breadcrumb([{ label, href? }, …]).');
        ui.breadcrumb([
          { label: 'Examples', href: '/' },
          { label: 'Overlays', href: '/examples/overlays' },
          { label: 'Current' },
        ]);

        exampleSection('Chrome bits', 'Avatar, tooltip, skeleton.');
        ui.row(
          () => {
            ui.avatar({ src: 'https://github.com/shadcn.png', alt: 'shadcn', fallback: 'CN', size: 'lg' });
            ui.avatar({ fallback: 'TS' });
            ui.tooltip({ text: 'Refresh data' }, () => {
              ui.button('Hint me', { variant: 'outline', size: 'sm' });
            });
            ui.skeleton({ className: 'h-8 w-32' });
          },
          { gap: 3 },
        );

        exampleSection('Dropdown menu', 'ui.dropdownMenu — items, separators, destructive variants.');
        ui.dropdownMenu({ label: 'Actions', variant: 'outline' }, (m) => {
          m.item('edit', 'Edit', {
            onSelect: () => ui.notify('Edit selected', 'info'),
          });
          m.separator();
          m.item('delete', 'Delete', {
            variant: 'destructive',
            onSelect: () => ui.notify('Delete selected', 'warning'),
          });
        });

        exampleSection('Context menu', 'ui.contextMenu — right-click the dashed trigger.');
        ui.contextMenu({ label: 'Right-click this target' }, (m) => {
          m.item('copy', 'Copy', { onSelect: () => ui.notify('Copy', 'info') });
          m.separator();
          m.item('remove', 'Remove', {
            variant: 'destructive',
            onSelect: () => ui.notify('Remove', 'warning'),
          });
        });

        exampleSection('Hover card / popover', 'ui.hoverCard + ui.popover (server-owned open).');
        ui.row(
          () => {
            ui.hoverCard({ text: 'Extra context on hover.', side: 'bottom' }, () => {
              ui.button('Hover me', { variant: 'outline', size: 'sm' });
            });
            const tip = ui.popover({ label: 'Open popover', open: false }, () => {
              ui.label('Popover body — close from the server or outside click.')
                .classes('text-sm text-muted-foreground');
              ui.button('Close', {
                size: 'sm',
                onClick: () => tip.close(),
              });
            });
          },
          { gap: 3 },
        );

        exampleSection('Tabs', 'Server-owned tab value for sheet / drawer / dialog copy.');
        ui.tabs({ value: 'sheet' }, (t) => {
          t.tab('sheet', 'Sheet', () => {
            ui.label('Side panel for filters and secondary tasks. Server owns open/close.')
              .classes('text-sm text-muted-foreground');
          });
          t.tab('drawer', 'Drawer', () => {
            ui.label('Mobile-friendly Vaul drawer from the bottom edge.')
              .classes('text-sm text-muted-foreground');
          });
          t.tab('dialog', 'Dialog', () => {
            ui.label('Centered modal for confirmations and focused forms.')
              .classes('text-sm text-muted-foreground');
          });
        });

        exampleSection('Disclosure', 'Accordion and collapsible.');
        ui.accordion((a) => {
          a.item('one', 'Getting started', () => {
            ui.label('Wire factories → ElementRenderer → ui facade.');
          });
          a.item('two', 'Overlays', () => {
            ui.label('Dialog, sheet, and drawer share server-owned open.');
          });
        });

        ui.collapsible({ title: 'Advanced options' }, () => {
          ui.label('Collapsible content stays optimistic on the client.');
        });

        exampleSection(
          'Modals',
          'Dialog + ui.alertDialog (confirm pattern) + sheet + drawer — open/close from the server.',
        );

        const confirm = ui.dialog(
          { title: 'Confirm action', open: false },
          () => {
            ui.label('This dialog is server-owned — open/close sync over the WebSocket.');
            ui.row(
              () => {
                ui.button('Cancel', {
                  variant: 'outline',
                  onClick: () => confirm.close(),
                });
                ui.button('Confirm', {
                  onClick: () => {
                    ui.notify('Confirmed', 'success');
                    confirm.close();
                  },
                });
              },
              { gap: 2 },
            );
          },
        );

        const danger = ui.alertDialog({
          title: 'Delete item?',
          description: 'This cannot be undone. Continues with the destructive confirm pattern.',
          confirmLabel: 'Delete',
          cancelLabel: 'Keep',
          confirmVariant: 'destructive',
          open: false,
          onConfirm: () => ui.notify('Deleted', 'success'),
        });

        const filters = ui.sheet({ title: 'Filters', description: 'Side panel', side: 'right' }, () => {
          ui.label('Pick filters, then close.');
          ui.button('Apply', { onClick: () => filters.close() });
        });

        const menu = ui.drawer({ title: 'Quick menu', direction: 'bottom' }, () => {
          ui.label('Mobile-friendly drawer.');
          ui.button('Close', { variant: 'outline', onClick: () => menu.close() });
        });

        ui.row(
          () => {
            ui.button('Open dialog', { onClick: () => confirm.open() });
            ui.button('Open alert', {
              variant: 'destructive',
              onClick: () => danger.open(),
            });
            ui.button('Open sheet', { variant: 'outline', onClick: () => filters.open() });
            ui.button('Open drawer', { variant: 'outline', onClick: () => menu.open() });
          },
          { gap: 2 },
        );

        exampleSection('Dialog stack', 'Complete onboarding in four steps, with back and next navigation.');

        const wizard = ui.dialogStack(
          { title: 'Onboarding', open: false, index: 0 },
          (stack) => {
            stack.step({ title: 'Account' }, () => {
              ui.label('Start with your account basics.')
                .classes('text-sm text-muted-foreground');
              ui.input({ label: 'Email', placeholder: 'you@example.com' });
              ui.input({ label: 'Display name', placeholder: 'Ada' });
            });

            stack.step({ title: 'Preferences' }, () => {
              ui.label('Pick defaults for this workspace.')
                .classes('text-sm text-muted-foreground');
              ui.checkbox({ label: 'Email me product updates', checked: true });
              ui.checkbox({ label: 'Weekly digest', checked: false });
            });

            stack.step({ title: 'Team' }, () => {
              ui.label('Optional — invite a teammate later.')
                .classes('text-sm text-muted-foreground');
              ui.input({ label: 'Invite email', placeholder: 'colleague@example.com' });
            });

            stack.step({ title: 'Confirm' }, () => {
              ui.label('Review and finish. You can go back to edit any step.')
                .classes('text-sm text-muted-foreground');
              ui.button('Finish', {
                onClick: () => {
                  ui.notify('Onboarding complete', 'success');
                  wizard.close();
                  wizard.setIndex(0);
                },
              });
            });
          },
        );

        ui.row(
          () => {
            ui.button('Open dialog stack', {
              onClick: () => {
                wizard.setIndex(0);
                wizard.open();
              },
            });
            ui.button('Open at step 2', {
              variant: 'outline',
              onClick: () => {
                wizard.setIndex(1);
                wizard.open();
              },
            });
          },
          { gap: 2 },
        );

      },
      { gap: 6 },
    );
  });
});
