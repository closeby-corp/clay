import { ui } from '@clay/ui';

export const pageMeta = { label: 'Home', icon: 'house', order: 0 };

ui.page('/', () => {
  ui.label('CLI fixture home');
});
