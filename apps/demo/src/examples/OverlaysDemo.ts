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
        exampleHeader(undefined, 'Sheet, drawer, accordion, tooltip, avatar, skeleton.');

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
            ui.button('Open sheet', { onClick: () => filters.open() });
            ui.button('Open drawer', { variant: 'outline', onClick: () => menu.open() });
          },
          { gap: 2 },
        );
      },
      { gap: 6 },
    );
  });
});
