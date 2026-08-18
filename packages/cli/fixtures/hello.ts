import { ui } from '@close-by/clay';

/** Minimal single-file app for CLI smoke tests / docs. */
ui.run(() => {
  ui.label('Hello Clay').classes('text-2xl font-semibold');
  ui.button('Ping', {
    onClick: () => ui.notify('hi', 'success'),
  });
});
