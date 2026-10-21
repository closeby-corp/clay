import type { ShellNavItem } from './types';

/** Find the active destination with the longest matching path across nav sections. */
export function findActiveNavItem(
  ...sections: Array<readonly ShellNavItem[] | undefined>
): ShellNavItem | undefined {
  let best: { item: ShellNavItem; hrefLength: number; depth: number } | undefined;

  const hasActiveDescendant = (item: ShellNavItem): boolean =>
    item.items?.some((child) => child.active || hasActiveDescendant(child)) ?? false;

  const visit = (items: readonly ShellNavItem[], depth: number) => {
    for (const item of items) {
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
        best = { item, hrefLength: item.href.length, depth };
      }
    }
  };

  for (const section of sections) {
    if (section) visit(section, 0);
  }
  return best?.item;
}

export function resolveAppShellTitle({
  title,
  headerTitle,
  nav,
  navSecondary,
  documents,
}: {
  title: string;
  headerTitle?: string;
  nav: readonly ShellNavItem[];
  navSecondary?: readonly ShellNavItem[];
  documents?: readonly ShellNavItem[];
}): string {
  if (headerTitle !== undefined) return headerTitle;
  return findActiveNavItem(nav, navSecondary, documents)?.label ?? (title || 'Clay');
}
