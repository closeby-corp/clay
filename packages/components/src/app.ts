import { Element, getCurrentSession, withParent } from '@clay/core';

export type AppNavItem = {
  label: string;
  href: string;
  /** Curated Lucide icon key resolved on the client (e.g. `home`, `gauge`). */
  icon?: string;
  description?: string;
};

export type AppUser = {
  name: string;
  email: string;
  avatar?: string;
};

export type AppProps = {
  /** Brand label in the sidebar header. */
  title?: string;
  /** Site header title; defaults to the active nav label on the client. */
  headerTitle?: string;
  collapsible?: 'offcanvas' | 'icon' | 'none';
  variant?: 'sidebar' | 'inset';
  user?: AppUser;
  nav: AppNavItem[];
  navSecondary?: AppNavItem[];
  documents?: AppNavItem[];
  className?: string;
};

function isActivePath(current: string, href: string): boolean {
  if (href === '/') return current === '/';
  if (href === '#' || !href) return false;
  return current === href || current.startsWith(`${href}/`);
}

function serializeNav(items: AppNavItem[] | undefined, path: string) {
  return (items ?? []).map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    description: item.description,
    active: isActivePath(path, item.href),
  }));
}

/**
 * SPA-style shell: dashboard sidebar + inset main content.
 * Server rebuilds the tree on each navigate (marks active nav from the session path);
 * the client keeps chrome mounted via a sticky `app` React key when structure matches.
 */
export function app(props: AppProps, fn: () => void): Element {
  const path = getCurrentSession()?.path ?? '/';
  const nav = serializeNav(props.nav, path);
  const active = nav.find((item) => item.active);

  const el = new Element('app', {
    title: props.title ?? '',
    headerTitle: props.headerTitle ?? active?.label ?? props.title ?? '',
    collapsible: props.collapsible ?? 'icon',
    variant: props.variant ?? 'inset',
    user: props.user ?? null,
    nav,
    navSecondary: serializeNav(props.navSecondary, path),
    documents: serializeNav(props.documents, path),
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
