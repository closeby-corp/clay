import { Element, getCurrentSession, withParent } from '@close-by/clay-core';

export type AppNavItem = {
  label: string;
  href: string;
  /** Curated Lucide icon key resolved on the client (e.g. `home`, `gauge`). */
  icon?: string;
  description?: string;
  /** Nested sidebar links under a collapsible group. */
  items?: AppNavItem[];
};

export type AppUser = {
  name: string;
  email: string;
  avatar?: string;
};

export type AppPrimaryAction = {
  label: string;
  href?: string;
  /** Lucide kebab-case icon; defaults to `plus-circle`. */
  icon?: string;
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
  /** Optional CTA above primary nav; omitted by default (no Quick Create). */
  primaryAction?: AppPrimaryAction;
  className?: string;
};

export type SerializedNavItem = {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  active: boolean;
  items?: SerializedNavItem[];
};

function isActivePath(current: string, href: string): boolean {
  if (href === '/') return current === '/';
  if (href === '#' || !href) return false;
  return current === href || current.startsWith(`${href}/`);
}

function serializeNav(items: AppNavItem[] | undefined, path: string): SerializedNavItem[] {
  return (items ?? []).map((item) => {
    const items = item.items?.length ? serializeNav(item.items, path) : undefined;
    const childActive = items?.some((child) => child.active) ?? false;
    const selfActive = isActivePath(path, item.href);
    return {
      label: item.label,
      href: item.href,
      icon: item.icon,
      description: item.description,
      active: selfActive || childActive,
      items,
    };
  });
}

/** Prefer the deepest active leaf for the site header title. */
export function findActiveNavLabel(items: SerializedNavItem[]): string | undefined {
  for (const item of items) {
    if (item.items?.length) {
      for (const child of item.items) {
        if (child.active) return child.label;
      }
      const nested = findActiveNavLabel(item.items);
      if (nested) return nested;
    }
    if (item.active && item.href !== '#') return item.label;
  }
  return undefined;
}

/**
 * SPA-style shell: dashboard sidebar + inset main content.
 * Server rebuilds the tree on each navigate (marks active nav from the session path);
 * the client keeps chrome mounted via a sticky `app` React key when structure matches.
 */
export function app(props: AppProps, fn: () => void): Element {
  const path = getCurrentSession()?.path ?? '/';
  const nav = serializeNav(props.nav, path);
  const activeLabel = findActiveNavLabel(nav);

  const el = new Element('app', {
    title: props.title ?? '',
    headerTitle: props.headerTitle ?? activeLabel ?? props.title ?? '',
    collapsible: props.collapsible ?? 'icon',
    variant: props.variant ?? 'inset',
    user: props.user ?? null,
    nav,
    navSecondary: serializeNav(props.navSecondary, path),
    documents: serializeNav(props.documents, path),
    primaryAction: props.primaryAction ?? null,
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
