import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

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

const CARD_KEYS = new Set(['title', 'subtitle', 'image', 'compact', 'bordered', 'bgColor', 'shadow', 'className']);

export class Card extends Component<CardProps> {
  constructor(props: CardProps = {}) {
    super(props, []);
  }
  
  render(): string {
    const imageSide = this.props.image?.position === 'side';
    const classes = [
      this.generateClasses(),
      imageSide ? 'card-side' : '',
    ].filter(Boolean).join(' ') + this.getExtraClasses();

    return `
      <div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
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

  private generateClasses(): string {
    const parts = ['card', 'w-96', 'bg-base-100', 'card-xs', 'shadow-sm'];

    if (this.props.compact) {
      parts.push('card-sm');
    }

    if (this.props.bordered) {
      parts.push('card-border');
    }

    parts.push(this.props.bgColor || 'bg-base-100');

    if (this.props.shadow) {
      parts.push(`shadow-${this.props.shadow}`);
    } else {
      parts.push('shadow-xl');
    }

    if (this.props.className) {
      parts.push(this.props.className);
    }

    return parts.join(' ');
  }
}

export function card(childrenFn: (card: Card) => void, props?: CardProps): Card;
export function card(...args: (LayoutChild | CardProps)[]): Card;
export function card(...args: unknown[]): Card {
  return buildLayout(Card, CARD_KEYS, ...args);
}
