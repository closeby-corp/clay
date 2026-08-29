/**
 * Experimental Clay JSX runtime (Spike B).
 *
 * Opt-in per app:
 *   // tsconfig
 *   "jsx": "react-jsx",
 *   "jsxImportSource": "@close-by/clay-core"
 *
 * Intrinsics are Clay wire types (`button`, `row`, `label`, …), not HTML DOM tags.
 * Function components receive props and may return `Element` | `Element[]` | `null`.
 *
 * Children are evaluated before parents (standard JSX). We create nodes detached,
 * then {@link Element.adopt} them under the parent — see docs/jsx-investigation.md.
 */
import { Element } from './element';
import { getCurrentParent, withDetached } from './context';

export type ClayJsxProps = Record<string, unknown> & {
  children?: unknown;
  className?: string;
  key?: string | number;
};

export type ClayJsxType = string | ((props: ClayJsxProps) => ClayJsxChild);

export type ClayJsxChild = Element | string | number | boolean | null | undefined | ClayJsxChild[];

function flatten(children: unknown): ClayJsxChild[] {
  if (children == null || children === false || children === true) return [];
  if (Array.isArray(children)) return children.flatMap(flatten);
  return [children as ClayJsxChild];
}

function attachToCurrentParent(el: Element): Element {
  const parent = getCurrentParent();
  if (parent) parent.adopt(el);
  return el;
}

function adoptChildren(parent: Element, children: unknown): void {
  for (const child of flatten(children)) {
    if (child instanceof Element) {
      parent.adopt(child);
    } else if (typeof child === 'string' || typeof child === 'number') {
      parent.adopt(withDetached(() => new Element('label', { text: String(child) })));
    }
  }
}

/** Classic runtime `jsx` / automatic runtime entry. */
export function jsx(
  type: ClayJsxType,
  props: ClayJsxProps | null,
  _key?: string | number,
): Element | Element[] | null {
  const p = props ?? {};
  const { children, key: _k, ...rest } = p;

  if (typeof type === 'function') {
    const result = withDetached(() => type({ ...rest, children }));
    if (result == null) return null;
    if (Array.isArray(result)) {
      for (const el of result) {
        if (el instanceof Element) attachToCurrentParent(el);
      }
      return result;
    }
    if (result instanceof Element) return attachToCurrentParent(result);
    return null;
  }

  const el = withDetached(() => new Element(type, rest));
  adoptChildren(el, children);
  return attachToCurrentParent(el);
}

export const jsxs = jsx;

/** Fragment: adopt children into the current parent; returns them as an array. */
export function Fragment(props: { children?: unknown }): Element[] {
  const out: Element[] = [];
  for (const child of flatten(props.children)) {
    if (child instanceof Element) {
      attachToCurrentParent(child);
      out.push(child);
    } else if (typeof child === 'string' || typeof child === 'number') {
      const el = withDetached(() => new Element('label', { text: String(child) }));
      attachToCurrentParent(el);
      out.push(el);
    }
  }
  return out;
}
