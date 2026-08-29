import { Element, withParent } from '@close-by/clay-core';

export type StepperStepStatus = 'pending' | 'active' | 'completed' | 'error' | 'loading';

export type StepperProps = {
  /** Active step index (server-owned). Default `0`. */
  index?: number;
  orientation?: 'horizontal' | 'vertical';
  /** Show Back / Next controls under the active step. Default `true` when >1 step. */
  showNav?: boolean;
  className?: string;
  onIndexChange?: (index: number) => void | Promise<void>;
};

export type StepperStepOptions = {
  title: string;
  description?: string;
  icon?: string;
  /** Override inferred status from index. */
  status?: StepperStepStatus;
  className?: string;
};

export class StepperElement extends Element {
  constructor(props: StepperProps = {}) {
    super('stepper', {
      index: props.index ?? 0,
      orientation: props.orientation ?? 'horizontal',
      showNav: props.showNav,
      className: props.className,
      onIndexChange: props.onIndexChange,
    });

    this.on('indexChange', async (value) => {
      const next = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(next)) return;
      this.setIndex(Math.trunc(next));
    });
  }

  setIndex(index: number): this {
    const count = this.children.filter((c) => c.type === 'stepperStep').length;
    const next = count > 0 ? Math.min(Math.max(0, Math.trunc(index)), count - 1) : 0;
    if (this.props.index === next) return this;
    this.update({ index: next });
    return this;
  }

  step(opts: StepperStepOptions, fn: () => void): Element {
    const panel = new Element('stepperStep', {
      title: opts.title,
      description: opts.description,
      icon: opts.icon,
      status: opts.status,
      className: opts.className,
    });
    withParent(panel, fn);
    return panel;
  }
}

export function stepper(
  fn: (s: StepperElement) => void,
  props?: StepperProps,
): StepperElement;
export function stepper(
  props: StepperProps,
  fn: (s: StepperElement) => void,
): StepperElement;
export function stepper(
  propsOrFn: StepperProps | ((s: StepperElement) => void),
  fnOrProps?: ((s: StepperElement) => void) | StepperProps,
): StepperElement {
  let props: StepperProps = {};
  let fn: (s: StepperElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as StepperProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (s: StepperElement) => void;
  }

  const el = new StepperElement(props);
  withParent(el, () => fn(el));

  const stepCount = el.children.filter((c) => c.type === 'stepperStep').length;
  if (stepCount > 0) {
    const raw = Number(el.props.index ?? 0);
    el.props.index = Math.min(Math.max(0, Math.trunc(Number.isFinite(raw) ? raw : 0)), stepCount - 1);
  }

  return el;
}
