import { Element, withParent } from '@close-by/clay-core';

export type DialogProps = {
  title?: string;
  open?: boolean;
  className?: string;
  onClose?: () => void | Promise<void>;
};

export class DialogElement extends Element {
  constructor(props: DialogProps = {}) {
    super('dialog', {
      title: props.title,
      open: props.open ?? false,
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

export function dialog(fn: (dlg: DialogElement) => void, props?: DialogProps): DialogElement;
export function dialog(props: DialogProps, fn: (dlg: DialogElement) => void): DialogElement;
export function dialog(
  propsOrFn: DialogProps | ((dlg: DialogElement) => void),
  fnOrProps?: ((dlg: DialogElement) => void) | DialogProps,
): DialogElement {
  let props: DialogProps = {};
  let fn: (dlg: DialogElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as DialogProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (dlg: DialogElement) => void;
  }

  const el = new DialogElement(props);
  withParent(el, () => fn(el));
  return el;
}
