import { Element } from '@clay/core';

export type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

export type TreeProps = {
  nodes: TreeNode[];
  /** Selected node id. */
  selected?: string;
  /** Expanded node ids. */
  expanded?: string[];
  disabled?: boolean;
  className?: string;
  onSelect?: (id: string) => void;
  onExpand?: (expanded: string[]) => void;
};

export function tree(props: TreeProps): Element {
  return new Element('tree', {
    nodes: props.nodes ?? [],
    selected: props.selected ?? '',
    expanded: props.expanded ?? [],
    disabled: props.disabled ?? false,
    className: props.className,
    onSelect: props.onSelect,
    onExpand: props.onExpand,
  });
}
