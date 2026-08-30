import { Element, withParent } from '@close-by/clay-core';

export type PageHeadingProps = {
  /** Primary page title. */
  title: string;
  /** Supporting line under the title. */
  description?: string;
  className?: string;
};

/**
 * Page title + optional description. Prefer this over stacked muted labels.
 */
export function pageHeading(props: PageHeadingProps, trailing?: () => void): Element {
  const el = new Element('pageHeading', {
    title: props.title,
    description: props.description ?? '',
    className: props.className,
  });
  if (trailing) withParent(el, trailing);
  return el;
}
