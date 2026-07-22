export interface VNode {
  tag: string | typeof Fragment | null;
  props: Record<string, unknown> | null;
  children: (VNode | string)[];
  key?: string | number | null;
}

export const Fragment = Symbol('Fragment');

function toVNode(child: unknown): VNode | string | null {
  if (child == null || child === false || child === true) return null;
  if (typeof child === 'object' && 'tag' in (child as VNode)) return child as VNode;
  return String(child);
}

function normalizeChildren(children: unknown): (VNode | string)[] {
  if (children == null || children === false || children === true) return [];
  if (Array.isArray(children)) return children.flat(Infinity).map(toVNode).filter(Boolean) as (VNode | string)[];
  const vnode = toVNode(children);
  return vnode ? [vnode] : [];
}

export function jsx(tag: any, props: any, key?: string | null): VNode {
  const { children, ...rest } = props || {};
  return {
    tag,
    props: Object.keys(rest).length > 0 || rest == null ? rest || null : null,
    children: normalizeChildren(children),
    key: key ?? null,
  };
}

export const jsxs = jsx;
export const jsxDEV = jsx;
