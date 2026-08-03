import type { AppProps } from '@badui/ui';

/** Shared chrome without primary nav (nav comes from `ui.navFromPages()`). */
export const APP_CHROME = {
  title: 'BadUI',
  variant: 'inset',
  collapsible: 'icon',
  user: {
    name: 'Demo User',
    email: 'demo@badui.dev',
    avatar: '',
  },
  navSecondary: [
    { label: 'Settings', href: '#settings', icon: 'settings' },
    { label: 'Get Help', href: '#help', icon: 'help-circle' },
    { label: 'Search', href: '#search', icon: 'search' },
  ],
  documents: [
    { label: 'Data Library', href: '#data-library', icon: 'database' },
    { label: 'Reports', href: '#reports', icon: 'clipboard-list' },
    { label: 'Word Assistant', href: '#word-assistant', icon: 'file' },
  ],
} satisfies Omit<AppProps, 'nav'>;
