import { page } from '@close-by/clay-core';

export const pageMeta = {
  label: 'Admin Only',
  icon: 'shield',
  order: 50,
  roles: ['admin'],
};

page('/examples/admin-only', () => {});
