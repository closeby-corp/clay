import { Element, withParent } from '@badui/core';

export type DrawerDirection = 'top' | 'bottom' | 'left' | 'right';

export type DrawerProps = {
  title?: string;
  description?: string;
  open?: boolean;
  direction?: DrawerDirection;
  className?: string;
  onClose?: () => void | Promise<void>;
};

export class DrawerElement extends Element {
  constructor(props: DrawerProps = {}) {
    super('drawer', {
      title: props.title,
      description: props.description,
      open: props.open ?? false,
      direction: props.direction ?? 'bottom',
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

export function drawer(fn: (d: DrawerElement) => void, props?: DrawerProps): DrawerElement;
export function drawer(props: DrawerProps, fn: (d: DrawerElement) => void): DrawerElement;
export function drawer(
  propsOrFn: DrawerProps | ((d: DrawerElement) => void),
  fnOrProps?: ((d: DrawerElement) => void) | DrawerProps,
): DrawerElement {
  let props: DrawerProps = {};
  let fn: (d: DrawerElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as DrawerProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (d: DrawerElement) => void;
  }

  const el = new DrawerElement(props);
  withParent(el, () => fn(el));
  return el;
}
