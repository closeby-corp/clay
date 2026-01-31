import { Component } from './component';

export type ComponentConstructor = new (...args: any[]) => Component;

export const pageRegistry = new Map<string, ComponentConstructor>();

export function page(path: string) {
  return function (target: ComponentConstructor) {
    pageRegistry.set(path, target);
  };
}
