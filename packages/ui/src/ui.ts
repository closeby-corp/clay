import {
  button as buttonFactory,
  label as labelFactory,
  badge as badgeFactory,
  alert as alertFactory,
  avatar as avatarFactory,
  divider as dividerFactory,
  kbd as kbdFactory,
  skeleton as skeletonFactory,
  stat as statFactory,
  progress as progressFactory,
  dataTable as dataTableFactory,
  type ButtonProps,
  type LabelContent,
  type LabelProps,
  type BadgeProps,
  type AlertProps,
  type AvatarProps,
  type DividerProps,
  type KbdProps,
  type SkeletonProps,
  type StatItem,
  type StatProps,
  type ProgressProps,
  type DataTableProps,
} from '@badui/components';
import { Card, type CardProps } from '@badui/components';
import { Column, type ColumnProps } from '@badui/components';
import { Container, type ContainerProps } from '@badui/components';
import { Row, type RowProps } from '@badui/components';
import { Hero, type HeroProps } from '@badui/components';
import { Stack, type StackProps } from '@badui/components';
import type { Component } from '@badui/core';
import { getCurrentContainer, withContainer } from './stack';

function addToCurrent<T extends { render(): string }>(component: T): T {
  getCurrentContainer().add(component);
  return component;
}

function withLayout<P extends Record<string, unknown>, T extends Component<P>>(
  LayoutClass: new (props: P) => T,
  propsOrFn: P | (() => void),
  fnOrProps?: (() => void) | P,
): T {
  let props: P;
  let fn: () => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as P) ?? ({} as P);
  } else {
    props = propsOrFn ?? ({} as P);
    fn = fnOrProps as () => void;
  }

  return withContainer(new LayoutClass(props), fn);
}

export function label(content?: LabelContent, props?: Omit<LabelProps, 'text'>) {
  return addToCurrent(labelFactory(content, props));
}

export function button(text?: string, props?: Omit<ButtonProps, 'text'>) {
  return addToCurrent(buttonFactory(text, props));
}

export function badge(text?: string, props?: Omit<BadgeProps, 'text'>) {
  return addToCurrent(badgeFactory(text, props));
}

export function alert(message?: string, props?: Omit<AlertProps, 'message'>) {
  return addToCurrent(alertFactory(message, props));
}

export function avatar(props?: AvatarProps) {
  return addToCurrent(avatarFactory(props));
}

export function divider(text?: string, props?: Omit<DividerProps, 'text'>) {
  return addToCurrent(dividerFactory(text, props));
}

export function kbd(keys?: string | string[], props?: Omit<KbdProps, 'keys'>) {
  return addToCurrent(kbdFactory(keys, props));
}

export function skeleton(props?: SkeletonProps) {
  return addToCurrent(skeletonFactory(props));
}

export function stat(items: StatItem[], props?: Omit<StatProps, 'items'>) {
  return addToCurrent(statFactory(items, props));
}

export function progress(value: number, props?: Omit<ProgressProps, 'value'>) {
  return addToCurrent(progressFactory(value, props));
}

export function dataTable<T extends Record<string, any>>(data: T[], props: Omit<DataTableProps<T>, 'data'>) {
  return addToCurrent(dataTableFactory(data, props));
}

export function row(fn: () => void, props?: RowProps): Row;
export function row(props: RowProps, fn: () => void): Row;
export function row(propsOrFn: RowProps | (() => void), fnOrProps?: (() => void) | RowProps): Row {
  return withLayout(Row, propsOrFn, fnOrProps);
}

export function column(fn: () => void, props?: ColumnProps): Column;
export function column(props: ColumnProps, fn: () => void): Column;
export function column(propsOrFn: ColumnProps | (() => void), fnOrProps?: (() => void) | ColumnProps): Column {
  return withLayout(Column, propsOrFn, fnOrProps);
}

export function container(fn: () => void, props?: ContainerProps): Container;
export function container(props: ContainerProps, fn: () => void): Container;
export function container(propsOrFn: ContainerProps | (() => void), fnOrProps?: (() => void) | ContainerProps): Container {
  return withLayout(Container, propsOrFn, fnOrProps);
}

export function stack(fn: () => void, props?: StackProps): Stack;
export function stack(props: StackProps, fn: () => void): Stack;
export function stack(propsOrFn: StackProps | (() => void), fnOrProps?: (() => void) | StackProps): Stack {
  return withLayout(Stack, propsOrFn, fnOrProps);
}

export function hero(fn: () => void, props?: HeroProps): Hero;
export function hero(props: HeroProps, fn: () => void): Hero;
export function hero(propsOrFn: HeroProps | (() => void), fnOrProps?: (() => void) | HeroProps): Hero {
  return withLayout(Hero, propsOrFn, fnOrProps);
}

export function card(fn: (card: Card) => void, props?: CardProps): Card;
export function card(props: CardProps, fn: (card: Card) => void): Card;
export function card(
  propsOrFn: CardProps | ((card: Card) => void),
  fnOrProps?: ((card: Card) => void) | CardProps,
): Card {
  let props: CardProps = {};
  let fn: (card: Card) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as CardProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (card: Card) => void;
  }

  const instance = new Card(props);
  return withContainer(instance, () => fn(instance));
}
