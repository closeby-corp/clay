export type PageFn = () => void;

const pages = new Map<string, PageFn>();

export function page(path: string, fn: PageFn): void {
  pages.set(path, fn);
}

export function getPage(path: string): PageFn | undefined {
  return pages.get(path);
}

export function getRegisteredPaths(): string[] {
  return [...pages.keys()];
}

export function clearPages(): void {
  pages.clear();
}
