import type { AppNavItem } from '@badui/ui';

/** Shared sidebar nav for the demo SPA shell (ShadCN docs–style: labels only). */
export const APP_NAV: AppNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Counter', href: '/examples/counter' },
  { label: 'Todo', href: '/examples/todo' },
  { label: 'Chat', href: '/examples/chat' },
  { label: 'File Upload', href: '/examples/upload' },
  { label: 'Dashboard', href: '/examples/dashboard' },
  { label: 'DataTable', href: '/examples/datatable' },
  { label: 'Slider Demo', href: '/examples/slider-demo' },
  { label: 'Form Demo', href: '/examples/form-demo' },
  { label: 'Kitchen Sink', href: '/examples/kitchen-sink' },
];

export const APP_SHELL = { title: 'BadUI', nav: APP_NAV } as const;
