import { Component } from '@ralph/core';

export type ContainerWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
export type ContainerPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ContainerProps {
  width?: ContainerWidth;
  padding?: ContainerPadding;
  centered?: boolean;
  className?: string;
}

export class Container extends Component<ContainerProps> {
  render(): string {
    const classes = this.generateClasses();

    return `
      <div id="${this.id}" class="${classes}">
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

// Functional API with children callback
export function container(children: () => void, props?: ContainerProps): Container {
  const container = new Container(props || {});
  // Note: In a real implementation, we'd need a context system to manage children
  // For now, this is a placeholder for the functional API pattern
  return container;
}
