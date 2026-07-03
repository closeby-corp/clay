import { Dialog, type DialogProps } from '../layouts/Dialog';

/** DaisyUI Modal — same structure as Dialog (uses modal classes). */
export class Modal extends Dialog {}

export function modal(childrenFn: (m: Modal) => void, props?: DialogProps): Modal {
  const instance = new Modal(props ?? {});
  childrenFn(instance);
  return instance;
}

export type { DialogProps as ModalProps };
