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

/** Prefer the most specific active destination across all app nav sections. */
export function findActiveNavLabel(
  items: SerializedNavItem[],
  ...additionalSections: SerializedNavItem[][]
): string | undefined {
  let best: { label: string; hrefLength: number; depth: number } | undefined;

  const hasActiveDescendant = (item: SerializedNavItem): boolean =>
    item.items?.some((child) => child.active || hasActiveDescendant(child)) ?? false;

  const visit = (entries: SerializedNavItem[], depth: number) => {
    for (const item of entries) {
      if (item.items?.length) visit(item.items, depth + 1);
      if (
        !item.active ||
        hasActiveDescendant(item) ||
        !item.href ||
        item.href.startsWith('#')
      ) {
        continue;
      }

      if (
        !best ||
        item.href.length > best.hrefLength ||
        (item.href.length === best.hrefLength && depth > best.depth)
      ) {
        best = { label: item.label, hrefLength: item.href.length, depth };
      }
    }
  };

  for (const section of [items, ...additionalSections]) visit(section, 0);
  return best?.label;
}

/**
 * SPA-style shell: dashboard sidebar + inset main content.
 * Server rebuilds the tree on each navigate (marks active nav from the session path);
 * the client keeps chrome mounted via a sticky `app` React key when structure matches.
 */
export function app(props: AppProps, fn: () => void): Element {
  const path = getCurrentSession()?.path ?? '/';
  const nav = serializeNav(props.nav, path);
  const navSecondary = serializeNav(props.navSecondary, path);
  const documents = serializeNav(props.documents, path);
  const activeLabel = findActiveNavLabel(nav, navSecondary, documents);

  const el = new Element('app', {
    title: props.title ?? '',
    headerTitle: props.headerTitle ?? activeLabel ?? (props.title || 'Clay'),
    collapsible: props.collapsible ?? 'icon',
    variant: props.variant ?? 'inset',
    user: props.user ?? null,
    nav,
    navSecondary,
    documents,
    primaryAction: props.primaryAction ?? null,
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
