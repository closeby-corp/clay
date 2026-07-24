import type { AppNavItem } from '@badui/ui';

/** Shared sidebar nav for the demo SPA shell. */
export const APP_NAV: AppNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Counter', href: '/examples/counter', description: 'Element refs & refreshable' },
  { label: 'Todo', href: '/examples/todo', description: 'bindValue & lists' },
  { label: 'Chat', href: '/examples/chat', description: 'GlobalState' },
  { label: 'File Upload', href: '/examples/upload', description: 'Mock upload list' },
  { label: 'Dashboard', href: '/examples/dashboard', description: 'Stats & table' },
  { label: 'DataTable', href: '/examples/datatable', description: 'Sortable table' },
  { label: 'Slider Demo', href: '/examples/slider-demo', description: 'Sliders & select' },
  { label: 'Form Demo', href: '/examples/form-demo', description: 'Form controls' },
  { label: 'Kitchen Sink', href: '/examples/kitchen-sink', description: 'ShadCN catalog' },
];

export const APP_SHELL = { title: 'BadUI', nav: APP_NAV } as const;
