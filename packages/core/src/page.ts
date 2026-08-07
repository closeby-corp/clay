/** Page builder invoked when a client mounts that route. */
export type PageFn = () => void;

/** Options for `ui.page` / `page`. */
export type PageOptions = {
  /** When false, skip the global app shell wrapper from `ui.run({ app })`. Default true. */
  shell?: boolean;
};

/** Registered page: builder + options. */
export type PageEntry = {
  fn: PageFn;
  options: PageOptions;
};

/**
 * Optional global shell around every page (set by `ui.run({ app })`).
 * Receives the page builder; call it inside your layout.
 */
export type PageWrapper = (runPage: PageFn) => void;

const pages = new Map<string, PageEntry>();
let pageWrapper: PageWrapper | null = null;

/** Install or clear the global page shell wrapper. Prefer `ui.run({ app })`. */
export function setPageWrapper(wrapper: PageWrapper | null): void {
  pageWrapper = wrapper;
}

/** Current global page wrapper, if any. */
export function getPageWrapper(): PageWrapper | null {
  return pageWrapper;
}

/**
 * Register a route. Prefer `ui.page` from `@badui/ui`.
 *
 * @example
 * ```ts
 * ui.page('/settings', () => {
 *   ui.label('Settings');
 * }, { shell: false });
 * ```
 */
export function page(path: string, fn: PageFn, options: PageOptions = {}): void {
  pages.set(path, { fn, options });
}

/** Page builder for `path`, if registered. */
export function getPage(path: string): PageFn | undefined {
  return pages.get(path)?.fn;
}

/** Full entry (builder + options) for `path`. */
export function getPageEntry(path: string): PageEntry | undefined {
  return pages.get(path);
}

/** All registered route paths (order is insertion order). */
export function getRegisteredPaths(): string[] {
  return [...pages.keys()];
}

/** Unregister all pages (tests / hot reload). */
export function clearPages(): void {
  pages.clear();
}
