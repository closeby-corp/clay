import { Component, type Renderable } from '@badui/core';

export type LayoutChild = Component | string | Renderable;

export interface LayoutBuilder<T extends Component> {
  add(child: LayoutChild): T;
}

export function isLayoutProps<P extends Record<string, unknown>>(
  value: unknown,
  keys: Set<string>,
): value is P {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (value instanceof Component) return false;
  if ('render' in value && typeof (value as Renderable).render === 'function') return false;
  return Object.keys(value).every((key) => keys.has(key));
}

export function buildLayout<P extends Record<string, unknown>, T extends LayoutBuilder<T>>(
  LayoutClass: new (props: P) => T,
  propKeys: Set<string>,
  ...args: unknown[]
): T {
  if (args.length >= 1 && typeof args[0] === 'function') {
    const fn = args[0] as (container: T) => void;
    const props = (args[1] ?? {}) as P;
    const instance = new LayoutClass(props);
    fn(instance);
    return instance;
  }

  if (args.length === 2 && typeof args[1] === 'function' && isLayoutProps<P>(args[0], propKeys)) {
    const props = args[0] as P;
    const fn = args[1] as (container: T) => void;
    const instance = new LayoutClass(props);
    fn(instance);
    return instance;
  }

  let props = {} as P;
  let children = args as LayoutChild[];
  const last = args[args.length - 1];

  if (isLayoutProps<P>(last, propKeys)) {
    props = last as P;
    children = args.slice(0, -1) as LayoutChild[];
  }

  const instance = new LayoutClass(props);
  for (const child of children) {
    instance.add(child);
  }
  return instance;
}
