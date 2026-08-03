import { Element, withParent } from '@badui/core';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = {
  text?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  onClick?: () => void | Promise<void>;
};

export function button(text?: string, props: Omit<ButtonProps, 'text'> = {}): Element {
  return new Element('button', {
    text: text ?? '',
    variant: props.variant ?? 'default',
    size: props.size ?? 'default',
    disabled: props.disabled ?? false,
    className: props.className,
    onClick: props.onClick,
  });
}

export type LabelProps = {
  text?: string;
  className?: string;
};

export function label(text?: string, props: Omit<LabelProps, 'text'> = {}): Element {
  return new Element('label', {
    text: text ?? '',
    className: props.className,
  });
}

export type InputProps = {
  value?: string;
  placeholder?: string;
  type?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
};

export function input(props: InputProps = {}): Element {
  return new Element('input', {
    value: props.value ?? '',
    placeholder: props.placeholder ?? '',
    type: props.type ?? 'text',
    label: props.label,
    disabled: props.disabled ?? false,
    className: props.className,
    onInput: props.onInput,
    onChange: props.onChange,
  });
}

export type CheckboxProps = {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
};

export function checkbox(props: CheckboxProps = {}): Element {
  return new Element('checkbox', {
    value: props.checked ?? false,
    label: props.label,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function select(props: SelectProps): Element {
  return new Element('select', {
    options: props.options,
    value: props.value ?? props.options[0]?.value ?? '',
    label: props.label,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type SliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (value: number) => void;
};

export function slider(props: SliderProps = {}): Element {
  return new Element('slider', {
    min: props.min ?? 0,
    max: props.max ?? 100,
    step: props.step ?? 1,
    value: props.value ?? 0,
    label: props.label,
    showValue: props.showValue ?? false,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type TextAreaProps = {
  value?: string;
  placeholder?: string;
  label?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
};

export function textArea(props: TextAreaProps = {}): Element {
  return new Element('textarea', {
    value: props.value ?? '',
    placeholder: props.placeholder ?? '',
    label: props.label,
    rows: props.rows ?? 3,
    disabled: props.disabled ?? false,
    className: props.className,
    onInput: props.onInput,
    onChange: props.onChange,
  });
}

export type LinkProps = {
  href: string;
  text?: string;
  className?: string;
};

export function link(text: string, href: string, props: Omit<LinkProps, 'href' | 'text'> = {}): Element {
  return new Element('link', {
    text,
    href,
    className: props.className,
  });
}

export type BadgeProps = {
  text?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Named palette color (`green`, `red`, …) or any CSS color (`#22c55e`, `rgb(…)`). Overrides variant when set. */
  color?: string;
  className?: string;
};

export function badge(text?: string, props: Omit<BadgeProps, 'text'> = {}): Element {
  return new Element('badge', {
    text: text ?? '',
    variant: props.variant ?? 'default',
    color: props.color,
    className: props.className,
  });
}

export type AlertProps = {
  message?: string;
  variant?: 'default' | 'destructive';
  className?: string;
};

export function alert(message?: string, props: Omit<AlertProps, 'message'> = {}): Element {
  return new Element('alert', {
    text: message ?? '',
    variant: props.variant ?? 'default',
    className: props.className,
  });
}

export type StatItem = { title: string; value: string | number };

export function stat(items: StatItem[], props: { className?: string } = {}): Element {
  return new Element('stat', {
    items,
    className: props.className,
  });
}

export {
  dataTable,
  DataTableElement,
  ROW_ID_FIELD,
  normalizeTableData,
  rowsToCsv,
  rowsToTsv,
  rowsToJson,
  type TableColumn,
  type DataTableAction,
  type DataTableProps,
  type ExportFormat,
  type ExportMode,
} from './data-table';

export { dialog, DialogElement, type DialogProps } from './dialog';

export {
  confirm,
  prompt,
  choose,
  type ConfirmOptions,
  type PromptOptions,
  type ChooseOptions,
  type ChooseOption,
} from './imperative';

type LayoutProps = {
  gap?: string | number;
  className?: string;
  centered?: boolean;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
};

function layout(
  type: string,
  propsOrFn: LayoutProps | (() => void),
  fnOrProps?: (() => void) | LayoutProps,
): Element {
  let props: LayoutProps = {};
  let fn: (() => void) | undefined;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as LayoutProps) ?? {};
  } else {
    props = propsOrFn ?? {};
    fn = fnOrProps as (() => void) | undefined;
  }

  const el = new Element(type, {
    gap: props.gap ?? 2,
    className: props.className,
    centered: props.centered,
    width: props.width,
  });

  if (fn) {
    // Element already attached to current parent; run children under this layout
    withParent(el, fn);
  }
  return el;
}

export function row(fn: () => void, props?: LayoutProps): Element;
export function row(props: LayoutProps, fn: () => void): Element;
export function row(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('row', propsOrFn, fnOrProps);
}

export function column(fn: () => void, props?: LayoutProps): Element;
export function column(props: LayoutProps, fn: () => void): Element;
export function column(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('column', propsOrFn, fnOrProps);
}

export function container(fn: () => void, props?: LayoutProps): Element;
export function container(props: LayoutProps, fn: () => void): Element;
export function container(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('container', propsOrFn, fnOrProps);
}

export function hero(fn: () => void, props?: LayoutProps): Element;
export function hero(props: LayoutProps, fn: () => void): Element;
export function hero(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('hero', propsOrFn, fnOrProps);
}

export type CardProps = LayoutProps & { title?: string; description?: string };

export function card(fn: (card: Element) => void, props?: CardProps): Element;
export function card(props: CardProps, fn: (card: Element) => void): Element;
export function card(
  propsOrFn: CardProps | ((card: Element) => void),
  fnOrProps?: ((card: Element) => void) | CardProps,
): Element {
  let props: CardProps = {};
  let fn: (card: Element) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as CardProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (card: Element) => void;
  }

  const el = new Element('card', {
    title: props.title,
    description: props.description,
    gap: props.gap ?? 4,
    className: props.className,
  });
  withParent(el, () => fn(el));
  return el;
}

export { app, type AppNavItem, type AppProps, type AppUser } from './app';
