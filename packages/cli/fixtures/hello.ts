import { ui } from '@badui/ui';

/** Minimal single-file app for CLI smoke tests / docs. */
ui.run(() => {
  ui.label('Hello BadUI').classes('text-2xl font-semibold');
  ui.button('Ping', {
    onClick: () => ui.notify('hi', 'success'),
  });
});
