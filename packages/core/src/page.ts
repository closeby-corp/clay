export type PageFn = () => void;

export type PageOptions = {
  /** When false, skip the global app shell wrapper from `ui.run({ app })`. Default true. */
  shell?: boolean;
};

export type PageEntry = {
  fn: PageFn;
  options: PageOptions;
};

export type PageWrapper = (runPage: PageFn) => void;

const pages = new Map<string, PageEntry>();
let pageWrapper: PageWrapper | null = null;

export function setPageWrapper(wrapper: PageWrapper | null): void {
  pageWrapper = wrapper;
}

export function getPageWrapper(): PageWrapper | null {
  return pageWrapper;
}

export function page(path: string, fn: PageFn, options: PageOptions = {}): void {
  pages.set(path, { fn, options });
}

export function getPage(path: string): PageFn | undefined {
  return pages.get(path)?.fn;
}

export function getPageEntry(path: string): PageEntry | undefined {
  return pages.get(path);
}

export function getRegisteredPaths(): string[] {
  return [...pages.keys()];
}

export function clearPages(): void {
  pages.clear();
}
