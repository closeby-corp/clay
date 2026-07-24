import {
  button as buttonFactory,
  label as labelFactory,
  input as inputFactory,
  checkbox as checkboxFactory,
  select as selectFactory,
  slider as sliderFactory,
  textArea as textAreaFactory,
  link as linkFactory,
  badge as badgeFactory,
  alert as alertFactory,
  stat as statFactory,
  dataTable as dataTableFactory,
  row as rowFactory,
  column as columnFactory,
  container as containerFactory,
  hero as heroFactory,
  card as cardFactory,
  type ButtonProps,
  type LabelProps,
  type InputProps,
  type CheckboxProps,
  type SelectProps,
  type SliderProps,
  type TextAreaProps,
  type LinkProps,
  type BadgeProps,
  type AlertProps,
  type StatItem,
  type DataTableProps,
  type CardProps,
} from '@badui/components';
import { Element, RefreshableElement, page as corePage } from '@badui/core';
import { BadUIServer, type BadUIServerConfig } from '@badui/server';

export function label(text?: string, props?: Omit<LabelProps, 'text'>): Element {
  return labelFactory(text, props);
}

export function button(text?: string, props?: Omit<ButtonProps, 'text'>): Element {
  return buttonFactory(text, props);
}

export function input(props?: InputProps): Element {
  return inputFactory(props);
}

export function checkbox(props?: CheckboxProps): Element {
  return checkboxFactory(props);
}

export function select(props: SelectProps): Element {
  return selectFactory(props);
}

export function slider(props?: SliderProps): Element {
  return sliderFactory(props);
}

export function textArea(props?: TextAreaProps): Element {
  return textAreaFactory(props);
}

export function link(text: string, href: string, props?: Omit<LinkProps, 'href' | 'text'>): Element {
  return linkFactory(text, href, props);
}

export function badge(text?: string, props?: Omit<BadgeProps, 'text'>): Element {
  return badgeFactory(text, props);
}

export function alert(message?: string, props?: Omit<AlertProps, 'message'>): Element {
  return alertFactory(message, props);
}

export function stat(items: StatItem[], props?: { className?: string }): Element {
  return statFactory(items, props);
}

export function dataTable(rows: Record<string, unknown>[], props: DataTableProps): Element {
  return dataTableFactory(rows, props);
}

export function row(fn: () => void, props?: Parameters<typeof rowFactory>[1]): Element;
export function row(props: Parameters<typeof rowFactory>[0], fn: () => void): Element;
export function row(a: any, b?: any): Element {
  return rowFactory(a, b);
}

export function column(fn: () => void, props?: Parameters<typeof columnFactory>[1]): Element;
export function column(props: Parameters<typeof columnFactory>[0], fn: () => void): Element;
export function column(a: any, b?: any): Element {
  return columnFactory(a, b);
}

export function container(fn: () => void, props?: Parameters<typeof containerFactory>[1]): Element;
export function container(props: Parameters<typeof containerFactory>[0], fn: () => void): Element;
export function container(a: any, b?: any): Element {
  return containerFactory(a, b);
}

export function hero(fn: () => void, props?: Parameters<typeof heroFactory>[1]): Element;
export function hero(props: Parameters<typeof heroFactory>[0], fn: () => void): Element;
export function hero(a: any, b?: any): Element {
  return heroFactory(a, b);
}

export function card(fn: (card: Element) => void, props?: CardProps): Element;
export function card(props: CardProps, fn: (card: Element) => void): Element;
export function card(a: any, b?: any): Element {
  return cardFactory(a, b);
}

export function refreshable(fn: () => void): RefreshableElement {
  return new RefreshableElement(fn);
}

export function page(path: string, fn: () => void): void {
  corePage(path, fn);
}

export function run(config: BadUIServerConfig = {}): BadUIServer {
  const server = new BadUIServer(config);
  server.start();
  return server;
}

export const ui = {
  label,
  button,
  input,
  checkbox,
  select,
  slider,
  textArea,
  link,
  badge,
  alert,
  stat,
  dataTable,
  row,
  column,
  container,
  hero,
  card,
  refreshable,
  page,
  run,
};

export default ui;
