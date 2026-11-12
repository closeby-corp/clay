import type { ElementNode } from './protocol';

/** Mirror value events locally because bindValue deliberately sends no server echo. */
export function echoValueEvent(tree: ElementNode, id: string, type: string, value: unknown): ElementNode {
  if ((type !== 'input' && type !== 'change') ||
      (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')) return tree;
  if (tree.id === id) {
    if (!Object.hasOwn(tree.props, 'value') || Object.is(tree.props.value, value)) return tree;
    return { ...tree, props: { ...tree.props, value } };
  }
  const children = tree.children.map((child) => echoValueEvent(child, id, type, value));
  return children.every((child, index) => child === tree.children[index]) ? tree : { ...tree, children };
}
