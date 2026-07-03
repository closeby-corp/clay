import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

export type ContainerWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
export type ContainerPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ContainerProps {
  width?: ContainerWidth;
  padding?: ContainerPadding;
  centered?: boolean;
  className?: string;
}

const CONTAINER_KEYS = new Set(['width', 'padding', 'centered', 'className']);

// Container that collects children from callback
export class Container extends Component<ContainerProps> {
  constructor(props: ContainerProps = {}) {
    super(props, []);
  }
  
  render(): string {
    const classes = this.generateClasses() + this.getExtraClasses();

    return `
      <div class="${classes}">
        ${this.renderChildren()}
      </div>
    `;
  }

  private generateClasses(): string {
    const parts: string[] = [];

    // Width
    if (this.props.width) {
      if (this.props.width === 'full') {
        parts.push('w-full');
      } else {
        parts.push(`max-w-${this.props.width}`);
      }
    } else {
      parts.push('max-w-7xl');
    }

    // Centering
    if (this.props.centered) {
      parts.push('mx-auto');
    }

    // Padding
    const padding = this.props.padding || 'md';
    if (padding !== 'none') {
      parts.push(`p-${padding === 'xs' ? '2' : padding === 'sm' ? '4' : padding === 'md' ? '6' : padding === 'lg' ? '8' : '12'}`);
    }

    // Custom classes
    if (this.props.className) {
      parts.push(this.props.className);
    }

    return parts.join(' ');
  }
}

// NiceGUI-style: container(col1, col2, { centered: true }) or container(c => c.add(...), props)
export function container(childrenFn: (container: Container) => void, props?: ContainerProps): Container;
export function container(...args: (LayoutChild | ContainerProps)[]): Container;
export function container(...args: unknown[]): Container {
  return buildLayout(Container, CONTAINER_KEYS, ...args);
}
