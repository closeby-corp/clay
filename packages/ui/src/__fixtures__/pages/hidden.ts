import { ui } from '@close-by/clay';

export const pageMeta = { label: 'Hidden', icon: 'eye-off', order: 50, nav: false };

ui.page('/examples/hidden', () => {
  ui.label('Hidden from nav');
});
