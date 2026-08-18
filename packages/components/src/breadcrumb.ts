import { Element } from '@close-by/clay-core';

export type BreadcrumbItem = {
  label: string;
  /** SPA path (`/…`) or absolute URL. Omit for the current (non-link) crumb. */
  href?: string;
};

export type BreadcrumbProps = {
  className?: string;
};

export function breadcrumb(
  items: BreadcrumbItem[],
  props: BreadcrumbProps = {},
): Element {
  return new Element('breadcrumb', {
    items,
    className: props.className,
  });
}
