import { fileURLToPath, pathToFileURL } from 'url';
import { join } from 'path';
import { readFile } from 'fs/promises';
import {
  clearPages,
  getRegisteredPaths,
  type PageFn,
} from '@close-by/clay-core';
import { warnClayPageIssues } from '@close-by/clay-compiler';
import {
  ensureReactiveLetPluginForPaths,
  registerReactiveLetPlugin,
} from '@close-by/clay-compiler/plugin';
import type { AppNavItem } from '@close-by/clay-components';

/**
 * Dynamic `import` that forces Bun to re-execute the module.
 * Query-string cache busting is ignored by Bun; clear `require.cache` instead
 * so `--reload` / repeated `loadPages` re-run top-level `ui.page(...)`.
 */
export async function importFresh(absPath: string): Promise<unknown> {
  const href = pathToFileURL(absPath).href;
  try {
    // Bun populates require.cache for ESM too (key = absolute path).
    if (typeof require !== 'undefined' && require.cache) {
      delete require.cache[absPath];
      delete require.cache[href];
    }
  } catch {
    // ignore
  }
  return import(href);
}

async function warnPageModuleIfNeeded(absPath: string): Promise<void> {
  try {
    const text = await readFile(absPath, 'utf8');
    warnClayPageIssues(text, absPath);
  } catch {
    // unreadable — import will surface the error
  }
}

/**
 * Optional metadata for a registered page — used by `navFromPages` / `loadPages`.
 * Export as `pageMeta` from a page module, or pass via `attachPageMeta`.
 *
 * @see docs/api.md — page discovery & nav
 */
export type PageMeta = {
  /** Sidebar / nav label. Default: title-cased last path segment (`/` → `"Home"`). */
  label?: string;
  /** Lucide icon name for nav. Default `"boxes"`. */
  icon?: string;
  /** Lower sorts first. Default `100`. Path `/` is forced to `0`. */
  order?: number;
  /** When `false`, omit from `navFromPages()` (route still registers). Default `true`. */
  nav?: boolean;
  /**
   * If set, `navFromPages({ role })` / `navFromPages({ roles })` only includes this
   * item when the viewer has at least one matching role. Omit = visible to everyone.
   * UX only — still call `requireRole` in the page builder.
   */
  roles?: string[];
  /** Nest this page under a collapsible sidebar group with the given label. */
  group?: string;
  /** Lucide icon for the group parent row (first page in the group with this set wins). */
  groupIcon?: string;
};

const pageMetaByPath = new Map<string, PageMeta>();

/** Clear all collected page meta (does not unregister routes). */
export function clearPageMeta(): void {
  pageMetaByPath.clear();
}

/** Meta attached for a registered path, if any. */
export function getPageMeta(path: string): PageMeta | undefined {
  return pageMetaByPath.get(path);
}

/** Attach or replace meta for a registered path (tests / advanced wiring). */
export function attachPageMeta(path: string, meta: PageMeta): void {
  pageMetaByPath.set(path, meta);
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
 * Clears prior registrations first, then fresh-imports each module (cache-busted)
 * so `--reload` picks up edits. Each module should call `ui.page` once; optional
 * `pageMeta` is attached to the new path.
 *
 * When `reactiveLet` is `'auto'` (default), scans pages for `// @clay-reactive` /
 * `"use reactive"` and registers the Bun plugin **before** imports so library
 * boot does not need a manual `registerReactiveLetPlugin()` call.
 */
export async function loadPages(
  dir: string | URL,
  opts?: { reactiveLet?: boolean | 'auto' },
): Promise<string[]> {
  const absDir = typeof dir === 'string' ? dir : fileURLToPath(dir);
  const glob = new Bun.Glob('**/*.{ts,tsx}');
  const files = [...glob.scanSync({ cwd: absDir })].filter((f) => !shouldSkipPageFile(f)).sort();
  const fullPaths = files.map((relative) => join(absDir, relative));

  const reactiveMode = opts?.reactiveLet ?? 'auto';
  if (reactiveMode === true) {
    registerReactiveLetPlugin();
  } else if (reactiveMode === 'auto') {
    await ensureReactiveLetPluginForPaths(fullPaths);
  }

  clearPages();
  clearPageMeta();

  const loaded: string[] = [];

  for (const relative of files) {
    const fullPath = join(absDir, relative);
    const pathsBefore = new Set(getRegisteredPaths());
    await warnPageModuleIfNeeded(fullPath);
    const mod = (await importFresh(fullPath)) as { pageMeta?: PageMeta };
    const added = getRegisteredPaths().filter((p) => !pathsBefore.has(p));
    if (added.length === 1 && mod.pageMeta) {
      pageMetaByPath.set(added[0]!, mod.pageMeta);
    } else if (added.length > 1 && mod.pageMeta) {
      // Ambiguous: attach meta to all newly registered paths
      for (const p of added) pageMetaByPath.set(p, mod.pageMeta);
    }
    for (const p of added) loaded.push(p);
  }

  return loaded;
}

/** Filter roles when building nav from page meta (`navFromPages`). */
export type NavFromPagesOptions = {
  /** Single viewer role (sugar for `roles: [role]`). */
  role?: string;
  /** Viewer roles — page is shown if it has no `roles` meta, or any overlap. */
  roles?: string[];
  /**
   * When true, nest `/examples/*` routes (except `/examples/auth`) under an
   * "Examples" group. Individual pages can override with `pageMeta.group`.
   */
  groupExamples?: boolean;
  /** Label for the auto examples group. Default `"Examples"`. */
  groupExamplesLabel?: string;
  /** Icon for the auto examples group. Default `"layout-grid"`. */
  groupExamplesIcon?: string;
};

type RankedNavPage = {
  href: string;
  label: string;
  icon: string;
  order: number;
  group?: string;
  groupIcon?: string;
};

function resolvePageGroup(
  href: string,
  meta: PageMeta,
  opts?: NavFromPagesOptions,
): { group?: string; groupIcon?: string } {
  if (meta.group !== undefined) {
    return meta.group ? { group: meta.group, groupIcon: meta.groupIcon } : {};
  }
  if (opts?.groupExamples && href.startsWith('/examples/') && href !== '/examples/auth') {
    return {
      group: opts.groupExamplesLabel ?? 'Examples',
      groupIcon: opts.groupExamplesIcon ?? 'layout-grid',
    };
  }
  return {};
}

function buildNavFromRanked(ranked: RankedNavPage[]): AppNavItem[] {
  const top: Array<{ order: number; node: AppNavItem }> = [];
  const groups = new Map<string, AppNavItem>();

  for (const row of ranked) {
    const leaf: AppNavItem = { label: row.label, href: row.href, icon: row.icon };
    if (!row.group) {
      top.push({ order: row.order, node: leaf });
      continue;
    }

    let parent = groups.get(row.group);
    if (!parent) {
      parent = {
        label: row.group,
        href: row.href,
        icon: row.groupIcon ?? 'folder',
        items: [],
      };
      groups.set(row.group, parent);
      top.push({ order: row.order, node: parent });
    } else {
      const entry = top.find((t) => t.node === parent);
      if (entry) entry.order = Math.min(entry.order, row.order);
      if (row.groupIcon && parent.icon === 'folder') parent.icon = row.groupIcon;
    }
    parent.items!.push(leaf);
  }

  top.sort((a, b) => a.order - b.order || a.node.label.localeCompare(b.node.label));
  return top.map((t) => t.node);
}

/**
 * Build primary sidebar nav from registered pages + collected `pageMeta`.
 * Filters by `nav: false` and optional role overlap; sorts by `order` then path.
 *
 * @example
 * ```ts
 * const nav = ui.navFromPages({ role: user.role });
 * ui.app({ nav }, () => ui.label('Home'));
 * ```
 */
export function navFromPages(opts?: NavFromPagesOptions): AppNavItem[] {
  const viewer = new Set<string>();
  if (opts?.role) viewer.add(opts.role);
  if (opts?.roles) {
    for (const r of opts.roles) viewer.add(r);
  }

  const paths = getRegisteredPaths();
  const ranked: RankedNavPage[] = paths
    .map((href) => {
      const meta = pageMetaByPath.get(href) ?? {};
      const order = href === '/' ? 0 : (meta.order ?? 100);
      const { group, groupIcon } = resolvePageGroup(href, meta, opts);
      return {
        href,
        label: meta.label ?? labelFromPath(href),
        icon: meta.icon ?? 'boxes',
        order,
        nav: meta.nav !== false,
        roles: meta.roles,
        group,
        groupIcon,
      };
    })
    .filter((item) => {
      if (!item.nav) return false;
      if (!item.roles || item.roles.length === 0) return true;
      if (viewer.size === 0) return false;
      return item.roles.some((r) => viewer.has(r));
    })
    .map(({ nav: _nav, roles: _roles, ...rest }) => rest);
  ranked.sort((a, b) => a.order - b.order || a.href.localeCompare(b.href));
  return buildNavFromRanked(ranked);
}

/** Test helper: clear page registry + meta map. */
export function resetPageDiscovery(): void {
  clearPages();
  clearPageMeta();
}

export type { PageFn };
