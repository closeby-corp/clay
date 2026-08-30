import { Element } from '@close-by/clay-core';

export type DescriptionListItem = {
  term: string;
  detail: string;
};

export type DescriptionListProps = {
  items: DescriptionListItem[];
  /** When true, term and detail sit on one row (master-detail panes). */
  horizontal?: boolean;
  className?: string;
};

/** Key-value rows for detail panels and audit summaries. */
export function descriptionList(props: DescriptionListProps): Element {
  return new Element('descriptionList', {
    items: props.items,
    horizontal: props.horizontal ?? false,
    className: props.className,
  });
}
