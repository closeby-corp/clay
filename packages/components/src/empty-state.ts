import { Element, withParent } from '@close-by/clay-core';

export type EmptyDensity = 'default' | 'inline';

export type EmptyProps = {
  title?: string;
  description?: string;
  /** Lucide icon name for the empty media slot. */
  icon?: string;
  /**
   * `default` — bordered centered empty (tables/panels).
   * `inline` — muted text block for feed footers / detail panes (no heavy chrome).
   */
  density?: EmptyDensity;
  className?: string;
};

/** Centered empty state for tables, feeds, and panels. */
export function empty(props: EmptyProps, footer?: () => void): Element {
  const el = new Element('empty', {
    title: props.title ?? '',
    description: props.description ?? '',
    icon: props.icon,
    density: props.density ?? 'default',
    className: props.className,
  });
  if (footer) withParent(el, footer);
  return el;
}
