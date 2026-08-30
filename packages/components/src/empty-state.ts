import { Element, withParent } from '@close-by/clay-core';

export type EmptyProps = {
  title?: string;
  description?: string;
  /** Lucide icon name for the empty media slot. */
  icon?: string;
  className?: string;
};

/** Centered empty state for tables, feeds, and panels. */
export function empty(props: EmptyProps, footer?: () => void): Element {
  const el = new Element('empty', {
    title: props.title ?? '',
    description: props.description ?? '',
    icon: props.icon,
    className: props.className,
  });
  if (footer) withParent(el, footer);
  return el;
}
