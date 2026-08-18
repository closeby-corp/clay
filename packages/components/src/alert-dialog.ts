import { Element } from '@close-by/clay-core';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

export type AlertDialogProps = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  open?: boolean;
  className?: string;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
};

export class AlertDialogElement extends Element {
  constructor(props: AlertDialogProps = {}) {
    super('alertdialog', {
      title: props.title,
      description: props.description,
      confirmLabel: props.confirmLabel ?? 'OK',
      cancelLabel: props.cancelLabel ?? 'Cancel',
      confirmVariant: props.confirmVariant ?? 'default',
      open: props.open ?? false,
      className: props.className,
      onConfirm: props.onConfirm,
      onClose: props.onClose,
    });

    this.on('close', async () => {
      this.setOpen(false);
    });
    this.on('confirm', async () => {
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

export function alertDialog(props: AlertDialogProps = {}): AlertDialogElement {
  return new AlertDialogElement(props);
}
