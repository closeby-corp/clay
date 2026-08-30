import { Element } from '@close-by/clay-core';

export type PaginationProps = {
  /** Current page (1-based). */
  page?: number;
  /** Total page count. */
  pageCount?: number;
  /** Show first/last page buttons. Default true when pageCount > 7. */
  showEdges?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (page: number) => void | Promise<void>;
};

/** Standalone pager outside `ui.dataTable`. */
export function pagination(props: PaginationProps = {}): Element {
  return new Element('pagination', {
    page: props.page ?? 1,
    pageCount: props.pageCount ?? 1,
    showEdges: props.showEdges,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}
