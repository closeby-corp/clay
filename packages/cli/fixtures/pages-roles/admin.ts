import { ui } from '@close-by/clay';

export const pageMeta = { label: 'Admin', roles: ['admin'] };

ui.page('/admin', () => {
  ui.label('CLI roles fixture admin');
});
