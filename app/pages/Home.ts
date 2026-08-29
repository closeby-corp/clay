import { ui } from '@close-by/clay';

export const pageMeta = {
  label: 'Home',
  icon: 'home',
  order: 0,
};

ui.page('/', () => {
  ui.label('Hello compiled Clay').classes('text-2xl font-semibold');
  ui.button('Ping', {
    onClick: () => ui.notify('hi from compiled binary', 'success'),
  });
});
