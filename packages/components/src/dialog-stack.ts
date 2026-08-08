import { Element, withParent } from '@badui/core';

export type DialogStackProps = {
  /** Optional stack-level heading (shown when the active step has no title). */
  title?: string;
  open?: boolean;
  /** Active step index (server-owned). Defaults to `0`. */
  index?: number;
  className?: string;
  onClose?: () => void | Promise<void>;
  onIndexChange?: (index: number) => void | Promise<void>;
};

export type DialogStackStepOptions = {
  title?: string;
  className?: string;
};

export class DialogStackElement extends Element {
  constructor(props: DialogStackProps = {}) {
    super('dialogStack', {
      title: props.title,
      open: props.open ?? false,
      index: props.index ?? 0,
      className: props.className,
      onClose: props.onClose,
      onIndexChange: props.onIndexChange,
    });

    this.on('close', async () => {
      this.setOpen(false);
    });

    this.on('indexChange', async (value) => {
      const next = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(next)) return;
      this.setIndex(Math.trunc(next));
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

  setIndex(index: number): this {
    const next = Math.max(0, Math.trunc(index));
    if (this.props.index === next) return this;
    this.update({ index: next });
    return this;
  }

  /**
   * Add a stack step. Children of the step render when that step is active
   * (and as stacked chrome for prior steps).
   */
  step(opts: DialogStackStepOptions, fn: () => void): Element {
    const panel = new Element('dialogStackStep', {
      title: opts.title,
      className: opts.className,
    });
    withParent(panel, fn);
    return panel;
  }
}

export function dialogStack(
  fn: (stack: DialogStackElement) => void,
  props?: DialogStackProps,
): DialogStackElement;
export function dialogStack(
  props: DialogStackProps,
  fn: (stack: DialogStackElement) => void,
): DialogStackElement;
export function dialogStack(
  propsOrFn: DialogStackProps | ((stack: DialogStackElement) => void),
  fnOrProps?: ((stack: DialogStackElement) => void) | DialogStackProps,
): DialogStackElement {
  let props: DialogStackProps = {};
  let fn: (stack: DialogStackElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as DialogStackProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (stack: DialogStackElement) => void;
  }

  const el = new DialogStackElement(props);
  withParent(el, () => fn(el));

  const stepCount = el.children.filter((c) => c.type === 'dialogStackStep').length;
  if (stepCount > 0) {
    const raw = Number(el.props.index ?? 0);
    const clamped = Math.min(Math.max(0, Math.trunc(Number.isFinite(raw) ? raw : 0)), stepCount - 1);
    el.props.index = clamped;
  }

  return el;
}
