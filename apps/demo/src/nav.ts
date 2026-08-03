import type { AppNavItem, AppProps } from '@badui/ui';

/** Shared sidebar nav for the demo SPA shell. */
export const APP_NAV: AppNavItem[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Counter', href: '/examples/counter', icon: 'gauge' },
  { label: 'Todo', href: '/examples/todo', icon: 'list-todo' },
  { label: 'Chat', href: '/examples/chat', icon: 'message-square' },
  { label: 'File Upload', href: '/examples/upload', icon: 'upload' },
  { label: 'Dashboard', href: '/examples/dashboard', icon: 'layout-dashboard' },
  { label: 'DataTable', href: '/examples/datatable', icon: 'table-2' },
  { label: 'Slider Demo', href: '/examples/slider-demo', icon: 'sliders-horizontal' },
  { label: 'Form Demo', href: '/examples/form-demo', icon: 'form-input' },
  { label: 'Kitchen Sink', href: '/examples/kitchen-sink', icon: 'boxes' },
];

export const APP_NAV_SECONDARY: AppNavItem[] = [
  { label: 'Settings', href: '#settings', icon: 'settings' },
  { label: 'Get Help', href: '#help', icon: 'help-circle' },
  { label: 'Search', href: '#search', icon: 'search' },
];

export const APP_DOCUMENTS: AppNavItem[] = [
  { label: 'Data Library', href: '#data-library', icon: 'database' },
  { label: 'Reports', href: '#reports', icon: 'clipboard-list' },
  { label: 'Word Assistant', href: '#word-assistant', icon: 'file' },
];

export const APP_SHELL = {
  title: 'BadUI',
  variant: 'inset',
  collapsible: 'icon',
  user: {
    name: 'Demo User',
    email: 'demo@badui.dev',
    avatar: '',
  },
  nav: APP_NAV,
  navSecondary: APP_NAV_SECONDARY,
  documents: APP_DOCUMENTS,
} satisfies AppProps;
