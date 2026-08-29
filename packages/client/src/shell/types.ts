import type { LucideIcon } from 'lucide-react';
import { resolveIcon } from '../icons';

export type ShellNavItem = {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  active?: boolean;
};

/** Optional CTA above primary nav (e.g. “New …”); omitted by default. */
export type ShellPrimaryAction = {
  label: string;
  href?: string;
  icon?: string;
};

export type ShellUser = {
  name: string;
  email: string;
  avatar?: string;
};

/** Resolve Lucide kebab-case icon name (full set; see `src/icons.ts`). */
export function resolveNavIcon(icon?: string): LucideIcon {
  return resolveIcon(icon);
}

export function go(href: string) {
  if (!href || href === '#') return;
  if (href.startsWith('#')) return;
  if (href.startsWith('/')) {
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } else {
    window.location.href = href;
  }
}
