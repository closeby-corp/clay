import { Element } from '@close-by/clay-core';

export type TimelineItemStatus = 'pending' | 'active' | 'completed' | 'error';

export type TimelineItem = {
  id?: string;
  /** Display timestamp (ISO or free text). */
  at?: string;
  title: string;
  description?: string;
  status?: TimelineItemStatus;
  /** Lucide kebab-case icon on the node. */
  icon?: string;
  avatar?: { src?: string; fallback?: string };
  badge?: string;
  /** Named palette (`emerald`, `red`, …) or CSS color for `badge`. */
  badgeColor?: string;
  /** Expandable detail (plain text). */
  body?: string;
  /** When `body` is set, start expanded. */
  defaultOpen?: boolean;
};

export type TimelineProps = {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

/** Chronological event list for feeds, deploy logs, and order status. */
export function timeline(props: TimelineProps): Element {
  return new Element('timeline', {
    items: props.items ?? [],
    orientation: props.orientation ?? 'vertical',
    className: props.className,
  });
}
