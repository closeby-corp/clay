import type { ElementNode } from './protocol';

/** Stable React key so `app` chrome survives session remounts across navigate. */
export const STICKY_APP_KEY = 'clay-sticky-app';

/**
 * React reconciliation key for an element node.
 * `app` uses a stable key so SidebarProvider / chrome stay mounted when the
 * server sends a fresh tree (new element ids) after `hello` / navigate.
 */
export function elementReactKey(node: ElementNode): string {
  if (node.type === 'app') return STICKY_APP_KEY;
  return node.id;
}

/** Find the dashboard `app` shell under a mount tree (`app` or `root` → `app`). */
export function findAppShell(tree: ElementNode): ElementNode | null {
  if (tree.type === 'app') return tree;
  if (tree.type === 'root') {
    return tree.children.find((c) => c.type === 'app') ?? null;
  }
  return null;
}

/**
 * True when both trees expose an `app` shell with matching chrome identity
 * (title / collapsible / variant). Nav `active` flags may differ.
 */
export function hasMatchingAppShell(prev: ElementNode | null, next: ElementNode): boolean {
  if (!prev) return false;
  const prevApp = findAppShell(prev);
  const nextApp = findAppShell(next);
  if (!prevApp || !nextApp) return false;
  return (
    String(prevApp.props.title ?? '') === String(nextApp.props.title ?? '') &&
    String(prevApp.props.collapsible ?? 'icon') === String(nextApp.props.collapsible ?? 'icon') &&
    String(prevApp.props.variant ?? 'inset') === String(nextApp.props.variant ?? 'inset')
  );
}
