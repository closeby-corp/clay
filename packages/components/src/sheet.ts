import { Element, withParent } from '@clay/core';

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

export type SheetProps = {
  title?: string;
  description?: string;
  open?: boolean;
  side?: SheetSide;
  className?: string;
  onClose?: () => void | Promise<void>;
};

export class SheetElement extends Element {
  constructor(props: SheetProps = {}) {
    super('sheet', {
      title: props.title,
      description: props.description,
      open: props.open ?? false,
      side: props.side ?? 'right',
      className: props.className,
      onClose: props.onClose,
    });

    this.on('close', async () => {
      this.setOpen(false);
    });
  }

  setOpen(open: boolean): this {
    if (this.props.open === open) return this;
    this.update({ open });
    return this;
  }

  open(): this {
    return this.setOpen(true);
  }

  close(): this {
    return this.setOpen(false);
  }
}

export function sheet(fn: (s: SheetElement) => void, props?: SheetProps): SheetElement;
export function sheet(props: SheetProps, fn: (s: SheetElement) => void): SheetElement;
export function sheet(
  propsOrFn: SheetProps | ((s: SheetElement) => void),
  fnOrProps?: ((s: SheetElement) => void) | SheetProps,
): SheetElement {
  let props: SheetProps = {};
  let fn: (s: SheetElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as SheetProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (s: SheetElement) => void;
  }

  const el = new SheetElement(props);
  withParent(el, () => fn(el));
  return el;
}
