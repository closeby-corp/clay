import { Component } from './component';
import { PageComponent, type PageRenderFn } from './page';

export type ComponentConstructor = new (...args: any[]) => Component;
export type PageFactory = () => Component;

export const pageRegistry = new Map<string, PageFactory>();

/** Register a page with a render function (NiceGUI-style, no class required). */
export function page(path: string, renderFn: PageRenderFn): void;
/** Register a page component class (legacy style). */
export function page(path: string): (target: ComponentConstructor) => void;
export function page(path: string, renderFn?: PageRenderFn) {
  if (renderFn) {
    pageRegistry.set(path, () => new PageComponent(renderFn));
    return;
  }

  return function (target: ComponentConstructor) {
    pageRegistry.set(path, () => new target());
  };
}
