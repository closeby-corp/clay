import { ui } from '@close-by/clay';

export const pageMeta = { label: 'Home', icon: 'home', order: 0 };

ui.page('/', () => {
  ui.label('Tailwind + Clay').classes('text-2xl font-semibold mb-2');
  ui.label('Arbitrary utilities work when scanned into globals.generated.css.').classes(
    'text-sm text-muted-foreground mb-4',
  );
  ui.badge('dense', { className: 'text-[10px] h-5' });
  ui.button('Copy', {
    icon: 'copy',
    className: 'mt-4',
    onClick: () => {
      ui.clipboard('hello');
      ui.notify('Copied', 'success');
    },
  });
});
