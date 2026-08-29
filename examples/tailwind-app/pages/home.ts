import { ui } from '@close-by/clay';

export const pageMeta = { label: 'Home', icon: 'home', order: 0 };

ui.page('/', () => {
  ui.label('Tailwind + Clay').classes('text-2xl font-semibold mb-2');
  ui.label('Arbitrary utilities are scanned from this file automatically.').classes(
    'text-sm text-muted-foreground mb-4',
  );
  ui.badge('dense', { className: 'text-[10px] h-5' });
  ui.button('Copy', {
    icon: 'copy',
    className: 'mt-4 w-[12rem]',
    onClick: () => {
      ui.clipboard('hello');
      ui.notify('Copied', 'success');
    },
  });
});
