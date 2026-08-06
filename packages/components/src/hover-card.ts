import { Element, withParent } from '@badui/core';

export type HoverCardSide = 'top' | 'right' | 'bottom' | 'left';

export type HoverCardProps = {
  /** Plain text content when not using a builder with children in the card. */
  text?: string;
  side?: HoverCardSide;
  className?: string;
};

/**
 * Hover card wrapping a trigger (children of the element).
 * Content is `text`, or nested children when using the builder form with a content fn.
 */
export function hoverCard(fn: () => void, props: HoverCardProps): Element;
export function hoverCard(props: HoverCardProps, fn: () => void): Element;
export function hoverCard(
  propsOrFn: HoverCardProps | (() => void),
  fnOrProps: (() => void) | HoverCardProps,
): Element {
  let props: HoverCardProps;
  let fn: () => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = fnOrProps as HoverCardProps;
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }

  const el = new Element('hovercard', {
    text: props.text ?? '',
    side: props.side ?? 'top',
    className: props.className,
  });
  withParent(el, fn);
  return el;
}

export type PopoverProps = {
  /** Trigger button label. */
  label?: string;
  open?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void | Promise<void>;
};

export class PopoverElement extends Element {
  constructor(props: PopoverProps = {}) {
    super('popover', {
      label: props.label ?? 'Open',
      open: props.open ?? false,
      className: props.className,
      onOpenChange: props.onOpenChange,
    });

    this.on('openChange', async (value) => {
      this.setOpen(!!value);
    });
  }

  setOpen(open: boolean): this {
    if (this.props.open === open) return this;
    this.update({ open });
    return this;
  }

  open(): void {
    this.setOpen(true);
  }

  close(): void {
    this.setOpen(false);
  }
}

export function popover(fn: (p: PopoverElement) => void, props?: PopoverProps): PopoverElement;
export function popover(props: PopoverProps, fn: (p: PopoverElement) => void): PopoverElement;
export function popover(
  propsOrFn: PopoverProps | ((p: PopoverElement) => void),
  fnOrProps?: ((p: PopoverElement) => void) | PopoverProps,
): PopoverElement {
  let props: PopoverProps = {};
  let fn: (p: PopoverElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as PopoverProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (p: PopoverElement) => void;
  }

  const el = new PopoverElement(props);
  withParent(el, () => fn(el));
  return el;
}
