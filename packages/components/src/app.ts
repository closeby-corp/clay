import { Element, getCurrentSession, runWithSession, withDetached, withParent } from '@close-by/clay-core';

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
  headerActions?: () => void;
  sidebarFooter?: () => void;
  sidebarFooterCollapsed?: 'hide' | 'icons';
  sidebarResizable?: boolean;
  sidebarWidth?: { default?: string; min?: string; max?: string };
  account?: { user: AppUser | (() => AppUser | null); menu?: () => void };
  nav: AppNavItem[];
  navSecondary?: AppNavItem[];
  documents?: AppNavItem[];
  /** Optional CTA above primary nav; omitted by default (no Quick Create). */
  primaryAction?: AppPrimaryAction;
  /**
   * Phone navigation. Default `'tabs'`: a bottom tab bar (up to 4 top-level items plus "More").
   * `'menu'` keeps only the hamburger sidebar sheet.
   */
  mobileNav?: 'tabs' | 'menu';
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
 * Navigation rebuilds page content and active nav. Socket-owned shell slots retain
 * their elements and handlers; the client keeps chrome mounted with a sticky app key.
 */
export function app(props: AppProps, fn: () => void): Element {
  const path = getCurrentSession()?.path ?? '/';
  const nav = serializeNav(props.nav, path);
  const navSecondary = serializeNav(props.navSecondary, path);
  const documents = serializeNav(props.documents, path);
  const activeLabel = findActiveNavLabel(nav, navSecondary, documents);

  const session = getCurrentSession();
  const owner = session?.shellSession ?? session;
  const buildShell = () => {
    const root = new Element('shell', {});
    for (const [type, builder] of [
      ['shellHeaderActions', props.headerActions],
      ['shellSidebarFooter', props.sidebarFooter],
      ['shellAccountMenu', props.account?.menu],
    ] as const) {
      if (builder) withParent(root, () => {
        const slot = new Element(type, {});
        withParent(slot, builder);
      });
    }
    const user = props.account
      ? (typeof props.account.user === 'function' ? props.account.user() : props.account.user)
      : props.user;
    root.props.user = user ?? null;
    return root;
  };
  let shell: Element;
  if (owner && owner !== session) {
    if (!owner.root) {
      owner.root = runWithSession(owner, () => withDetached(buildShell));
      owner.isMounted = true;
    }
    shell = owner.root;
  } else {
    shell = withDetached(buildShell);
  }

  const el = new Element('app', {
    title: props.title ?? '',
    headerTitle: props.headerTitle ?? activeLabel ?? (props.title || 'Clay'),
    collapsible: props.collapsible ?? 'icon',
    variant: props.variant ?? 'inset',
    user: shell.props.user,
    sidebarFooterCollapsed: props.sidebarFooterCollapsed ?? 'hide',
    sidebarResizable: props.sidebarResizable ?? true,
    sidebarWidth: props.sidebarWidth,
    nav,
    navSecondary,
    documents,
    primaryAction: props.primaryAction ?? null,
    mobileNav: props.mobileNav ?? 'tabs',
    className: props.className,
  });
  withParent(el, fn);
  if (owner && owner !== session) {
    // Serialize socket-owned slots without transferring them to the disposable page.
    const toJSON = el.toJSON.bind(el);
    el.toJSON = () => {
      const node = toJSON();
      node.children.push(...shell.children.map((child) => child.toJSON()));
      return node;
    };
  } else {
    for (const slot of [...shell.children]) el.adopt(slot);
  }
  return el;
}
