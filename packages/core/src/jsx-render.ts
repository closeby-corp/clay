import { type VNode, Fragment } from './jsx-runtime';

const BOOL_ATTRS = new Set([
  'disabled', 'checked', 'selected', 'readonly', 'required',
  'multiple', 'autofocus', 'hidden', 'open', 'loop', 'controls',
  'autoplay', 'muted', 'defer', 'async', 'nomodule', 'novalidate',
  'itemscope', 'allowfullscreen',
]);

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function attrValue(key: string, value: unknown): string | null {
  if (value == null || value === false) return null;
  if (value === true) return BOOL_ATTRS.has(key) ? key : 'true';
  const str = String(value);
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderAttrs(props: Record<string, unknown> | null): string {
  if (!props) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'ref' || key === 'dangerouslySetInnerHTML') continue;
    if (key === 'className' && value) {
      parts.push(`class="${attrValue('class', value)}"`);
      continue;
    }
    if (key === 'htmlFor' && value) {
      parts.push(`for="${attrValue('for', value)}"`);
      continue;
    }
    if (key.startsWith('on')) continue;
    if (key === 'style' && typeof value === 'object' && value) {
      const styles = Object.entries(value as Record<string, string>)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${v}`)
        .join(';');
      parts.push(`style="${styles}"`);
      continue;
    }
    const rendered = attrValue(key, value);
    if (rendered !== null) {
      parts.push(`${key}="${rendered}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function renderChildren(children: (VNode | string)[]): string {
  return children.map(child => typeof child === 'string' ? child : renderVNode(child)).join('');
}

function renderVNode(node: VNode): string {
  if (node.tag === null) return '';
  if (node.tag === Fragment) return renderChildren(node.children);

  if (typeof node.tag === 'function') {
    const rendered = (node.tag as (props: Record<string, unknown>) => VNode)(node.props || {});
    return renderVNode(rendered);
  }

  const tag = node.tag as string;
  const attrs = renderAttrs(node.props);

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrs}>`;
  }

  const inner = node.props?.dangerouslySetInnerHTML
    ? (node.props.dangerouslySetInnerHTML as { __html: string }).__html
    : renderChildren(node.children);

  return `<${tag}${attrs}>${inner}</${tag}>`;
}

export function renderToString(vnode: VNode): string {
  return renderVNode(vnode);
}
