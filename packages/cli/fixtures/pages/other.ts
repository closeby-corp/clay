import { ui } from '@clay/ui';

export const pageMeta = { label: 'Other', icon: 'zap', order: 10 };

ui.page('/other', () => {
  ui.label('CLI fixture other');
});
