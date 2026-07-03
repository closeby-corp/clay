import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

export interface HeroProps {
  title?: string;
  subtitle?: string;
  bgImage?: string;
  className?: string;
}

const HERO_KEYS = new Set(['title', 'subtitle', 'bgImage', 'className']);

export class Hero extends Component<HeroProps> {
  constructor(props: HeroProps = {}) {
    super(props, []);
  }

  render(): string {
    const style = this.props.bgImage ? ` style="background-image: url('${this.props.bgImage}')"` : '';
    const classes = ['hero', 'min-h-64', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}"${style}${this.getExtraStyles()}>
        <div class="hero-overlay bg-opacity-60"></div>
        <div class="hero-content text-center text-neutral-content">
          <div class="max-w-md">
            ${this.props.title ? `<h1 class="mb-5 text-5xl font-bold">${this.props.title}</h1>` : ''}
            ${this.props.subtitle ? `<p class="mb-5">${this.props.subtitle}</p>` : ''}
            ${this.renderChildren()}
          </div>
        </div>
      </div>
    `;
  }
}

export function hero(childrenFn: (h: Hero) => void, props?: HeroProps): Hero;
export function hero(...args: (LayoutChild | HeroProps)[]): Hero;
export function hero(...args: unknown[]): Hero {
  return buildLayout(Hero, HERO_KEYS, ...args);
}
