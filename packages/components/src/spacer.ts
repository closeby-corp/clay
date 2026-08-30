import { Element } from '@close-by/clay-core';

export type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpacerOrientation = 'horizontal' | 'vertical';

export type SpacerProps = {
  /**
   * `horizontal` (default) — fixed width between row children.
   * `vertical` — fixed height between column children.
   */
  orientation?: SpacerOrientation;
  /** Spacing scale. Default `md`. */
  size?: SpacerSize;
  className?: string;
};

/**
 * Explicit gap between siblings when a shared parent `gap` is the wrong rhythm.
 * Prefer `row` / `column` `{ gap }` for even stacks; use spacer for uneven breaks.
 */
export function spacer(props: SpacerProps = {}): Element {
  return new Element('spacer', {
    orientation: props.orientation ?? 'horizontal',
    size: props.size ?? 'md',
    className: props.className,
  });
}
