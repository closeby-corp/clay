import { Element, withParent } from '@clay/core';

export type ResizableOrientation = 'horizontal' | 'vertical';

export type ResizableProps = {
  orientation?: ResizableOrientation;
  className?: string;
};

export type ResizablePanelProps = {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
};

export type ResizableHandleProps = {
  withHandle?: boolean;
  className?: string;
};

export class ResizableElement extends Element {
  constructor(props: ResizableProps = {}) {
    super('resizable', {
      orientation: props.orientation ?? 'horizontal',
      className: props.className,
    });
  }

  panel(fn: () => void, props?: ResizablePanelProps): Element;
  panel(props: ResizablePanelProps, fn: () => void): Element;
  panel(
    propsOrFn: ResizablePanelProps | (() => void),
    fnOrProps?: (() => void) | ResizablePanelProps,
  ): Element {
    let props: ResizablePanelProps = {};
    let fn: () => void;

    if (typeof propsOrFn === 'function') {
      fn = propsOrFn;
      props = (fnOrProps as ResizablePanelProps) ?? {};
    } else {
      props = propsOrFn;
      fn = fnOrProps as () => void;
    }

    const el = new Element('resizablepanel', {
      defaultSize: props.defaultSize,
      minSize: props.minSize,
      maxSize: props.maxSize,
      className: props.className,
    });
    withParent(el, fn);
    return el;
  }

  handle(props: ResizableHandleProps = {}): Element {
    return new Element('resizablehandle', {
      withHandle: props.withHandle ?? true,
      className: props.className,
    });
  }
}

export function resizable(
  fn: (r: ResizableElement) => void,
  props?: ResizableProps,
): ResizableElement;
export function resizable(
  props: ResizableProps,
  fn: (r: ResizableElement) => void,
): ResizableElement;
export function resizable(
  propsOrFn: ResizableProps | ((r: ResizableElement) => void),
  fnOrProps?: ((r: ResizableElement) => void) | ResizableProps,
): ResizableElement {
  let props: ResizableProps = {};
  let fn: (r: ResizableElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as ResizableProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (r: ResizableElement) => void;
  }

  const el = new ResizableElement(props);
  withParent(el, () => fn(el));
  return el;
}
