import { fileURLToPath } from 'url';
import { join } from 'path';
import {
  clearPages,
  getRegisteredPaths,
  type PageFn,
} from '@badui/core';
import type { AppNavItem } from '@badui/components';

export type PageMeta = {
  label?: string;
  icon?: string;
  /** Lower sorts first. Default `100`. Path `/` is forced to `0`. */
  order?: number;
  /** When `false`, omit from `navFromPages()` (route still registers). Default `true`. */
  nav?: boolean;
};

const pageMetaByPath = new Map<string, PageMeta>();

export function clearPageMeta(): void {
  pageMetaByPath.clear();
}

export function getPageMeta(path: string): PageMeta | undefined {
  return pageMetaByPath.get(path);
}

function titleCaseSegment(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function labelFromPath(path: string): string {
  if (path === '/') return 'Home';
  const segment = path.split('/').filter(Boolean).pop() ?? path;
  return titleCaseSegment(segment);
}

function shouldSkipPageFile(relativePath: string): boolean {
  const base = relativePath.split('/').pop() ?? relativePath;
  if (base === 'index.ts' || base === 'index.tsx') return true;
  if (base.startsWith('_')) return true;
  if (base.includes('.test.')) return true;
  if (relativePath.split('/').some((part) => part.startsWith('_'))) return true;
  return false;
}

/**
 * Dynamically import page modules under `dir`.
 * Each module should call `ui.page` once; optional `pageMeta` is attached to the new path.
 */
export async function loadPages(dir: string | URL): Promise<string[]> {
  const absDir = typeof dir === 'string' ? dir : fileURLToPath(dir);
  const glob = new Bun.Glob('**/*.{ts,tsx}');
  const files = [...glob.scanSync({ cwd: absDir })].filter((f) => !shouldSkipPageFile(f)).sort();

  const before = new Set(getRegisteredPaths());
  const loaded: string[] = [];

  for (const relative of files) {
    const fullPath = join(absDir, relative);
    const pathsBefore = new Set(getRegisteredPaths());
    const mod = (await import(fullPath)) as { pageMeta?: PageMeta };
    const added = getRegisteredPaths().filter((p) => !pathsBefore.has(p));
    if (added.length === 1 && mod.pageMeta) {
      pageMetaByPath.set(added[0]!, mod.pageMeta);
    } else if (added.length > 1 && mod.pageMeta) {
      // Ambiguous: attach meta to all newly registered paths
      for (const p of added) pageMetaByPath.set(p, mod.pageMeta);
    }
    for (const p of added) {
      if (!before.has(p)) loaded.push(p);
    }
  }

  return loaded;
}

/** Build primary sidebar nav from registered pages + collected `pageMeta`. */
export function navFromPages(): AppNavItem[] {
  const paths = getRegisteredPaths();
  const ranked = paths
    .map((href) => {
      const meta = pageMetaByPath.get(href) ?? {};
      const order = href === '/' ? 0 : (meta.order ?? 100);
      return {
        href,
        label: meta.label ?? labelFromPath(href),
        icon: meta.icon ?? 'boxes',
        order,
        nav: meta.nav !== false,
      };
    })
    .filter((item) => item.nav);
  ranked.sort((a, b) => a.order - b.order || a.href.localeCompare(b.href));
  return ranked.map(({ href, label, icon }) => ({ href, label, icon }));
}

/** Test helper: clear page registry + meta map. */
export function resetPageDiscovery(): void {
  clearPages();
  clearPageMeta();
}

export type { PageFn };
