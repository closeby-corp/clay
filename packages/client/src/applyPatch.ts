import type { ElementNode, Patch } from './protocol';

/** Apply a single patch to an element tree (immutable). */
export function applyPatch(tree: ElementNode, patch: Patch): ElementNode {
  if (patch.op === 'replace') {
    if (tree.id === patch.id) return patch.node;
    return {
      ...tree,
      children: tree.children.map((c) => applyPatch(c, patch)),
    };
  }

  if (patch.op === 'remove') {
    return {
      ...tree,
      children: tree.children
        .filter((c) => c.id !== patch.id)
        .map((c) => applyPatch(c, patch)),
    };
  }

  if (patch.op === 'updateProps') {
    if (tree.id === patch.id) {
      return { ...tree, props: { ...tree.props, ...patch.props } };
    }
    return {
      ...tree,
      children: tree.children.map((c) => applyPatch(c, patch)),
    };
  }

  if (patch.op === 'setChildren') {
    if (tree.id === patch.id) {
      return { ...tree, children: patch.children };
    }
    return {
      ...tree,
      children: tree.children.map((c) => applyPatch(c, patch)),
    };
  }

  return tree;
}
