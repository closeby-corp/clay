import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Overlays & disclosure',
  icon: 'layout-dashboard',
  order: 85,
};

ui.page('/examples/overlays', () => {
  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'Dialog, sheet, drawer, tabs, accordion, tooltip, avatar, skeleton.',
        );

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
            ui.button('Open sheet', { variant: 'outline', onClick: () => filters.open() });
            ui.button('Open drawer', { variant: 'outline', onClick: () => menu.open() });
          },
          { gap: 2 },
        );
      },
      { gap: 6 },
    );
  });
});
