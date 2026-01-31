import { Component } from '@ralph/core';

export interface CardProps {
  title?: string;
  subtitle?: string;
  image?: {
    src: string;
    alt?: string;
    position?: 'top' | 'side';
  };
  compact?: boolean;
  bordered?: boolean;
  bgColor?: string;
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export class Card extends Component<CardProps> {
  render(): string {
    const classes = [
      'card',
      this.props.compact ? 'card-compact' : '',
      this.props.bordered ? 'card-bordered' : '',
      this.props.bgColor || 'bg-base-100',
      this.props.shadow ? `shadow-${this.props.shadow}` : 'shadow-xl',
      this.props.className || ''
    ].filter(Boolean).join(' ');

    const imageSide = this.props.image?.position === 'side';

    return `
      <div id="${this.id}" class="${classes} ${imageSide ? 'card-side' : ''}">
        ${this.props.image && !imageSide ? `
          <figure>
            <img src="${this.props.image.src}" alt="${this.props.image.alt || ''}" />
          </figure>
        ` : ''}
        
        <div class="card-body">
          ${this.props.title ? `<h2 class="card-title">${this.props.title}</h2>` : ''}
          ${this.props.subtitle ? `<p class="text-sm opacity-70">${this.props.subtitle}</p>` : ''}
          
          <div class="card-content">
            ${this.renderChildren()}
          </div>
        </div>
        
        ${this.props.image && imageSide ? `
          <figure>
            <img src="${this.props.image.src}" alt="${this.props.image.alt || ''}" />
          </figure>
        ` : ''}
      </div>
    `;
  }
}

export function card(children: () => void, props?: CardProps): Card {
  const card = new Card(props || {});
  // Note: children callback pattern requires a context system
  return card;
}
