import { Element, getCurrentSession, withParent } from '@badui/core';

export type AppNavItem = {
  label: string;
  href: string;
  description?: string;
};

export type AppProps = {
  title?: string;
  nav: AppNavItem[];
  className?: string;
};

function isActivePath(current: string, href: string): boolean {
  if (href === '/') return current === '/';
  return current === href || current.startsWith(`${href}/`);
}

/**
 * SPA-style shell: sidebar nav + main content in the center.
 * Rebuilds on each page remount (marks active nav from the current session path).
 */
export function app(props: AppProps, fn: () => void): Element {
  const path = getCurrentSession()?.path ?? '/';
  const el = new Element('app', {
    title: props.title ?? '',
    nav: props.nav.map((item) => ({
      label: item.label,
      href: item.href,
      description: item.description,
      active: isActivePath(path, item.href),
    })),
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
