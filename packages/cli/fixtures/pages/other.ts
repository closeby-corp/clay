import { ui } from '@close-by/clay';

export const pageMeta = { label: 'Other', icon: 'zap', order: 10 };

ui.page('/other', () => {
  ui.label('CLI fixture other');
});
