import { Element } from '@close-by/clay-core';

export type ItemListEntry = {
  id?: string;
  title: string;
  description?: string;
  /** Lucide icon name for media slot. */
  icon?: string;
  href?: string;
  badge?: string;
};

export type ItemListProps = {
  items: ItemListEntry[];
  variant?: 'default' | 'outline' | 'muted';
  size?: 'default' | 'sm';
  className?: string;
  onSelect?: (id: string) => void | Promise<void>;
};

/** Settings / notification rows (wire `item.tsx` primitives). */
export function itemList(props: ItemListProps): Element {
  return new Element('itemList', {
    items: props.items,
    variant: props.variant ?? 'outline',
    size: props.size ?? 'sm',
    className: props.className,
    onSelect: props.onSelect,
  });
}
