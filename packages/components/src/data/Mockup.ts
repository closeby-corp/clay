import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export type MockupType = 'browser' | 'code' | 'phone' | 'window';

export interface MockupProps {
  type?: MockupType;
  title?: string;
  className?: string;
}

const MOCKUP_KEYS = new Set(['type', 'title', 'className']);

export class Mockup extends Component<MockupProps> {
  constructor(props: MockupProps = {}) {
    super(props, []);
  }

  render(): string {
    const type = this.props.type || 'browser';
    const classes = [this.getMockupClass(type), this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    if (type === 'code') {
      return `
        <div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
          <pre data-prefix="$"><code>${this.renderChildren()}</code></pre>
        </div>
      `;
    }

    if (type === 'phone') {
      return `
        <div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
          <div class="mockup-phone-camera"></div>
          <div class="mockup-phone-display">${this.renderChildren()}</div>
        </div>
      `;
    }

    if (type === 'window') {
      return `
        <div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
          <div class="mockup-window-toolbar">
            <div class="flex gap-1"><div class="w-3 h-3 rounded-full bg-error"></div><div class="w-3 h-3 rounded-full bg-warning"></div><div class="w-3 h-3 rounded-full bg-success"></div></div>
            ${this.props.title ? `<div class="text-xs opacity-60">${this.props.title}</div>` : ''}
          </div>
          <div>${this.renderChildren()}</div>
        </div>
      `;
    }

    // browser (default)
    return `
      <div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <div class="mockup-browser-toolbar">
          <div class="input">${this.props.title || 'https://daisyui.com'}</div>
        </div>
        <div class="flex justify-center px-4 py-16">${this.renderChildren()}</div>
      </div>
    `;
  }

  private getMockupClass(type: MockupType): string {
    switch (type) {
      case 'code': return 'mockup-code w-full';
      case 'phone': return 'mockup-phone';
      case 'window': return 'mockup-window border border-base-300';
      default: return 'mockup-browser border border-base-300';
    }
  }
}

export function mockup(childrenFn: (m: Mockup) => void, props?: MockupProps): Mockup;
export function mockup(...args: (LayoutChild | MockupProps)[]): Mockup;
export function mockup(...args: unknown[]): Mockup {
  return buildLayout(Mockup, MOCKUP_KEYS, ...args);
}

export function browserMockup(childrenFn: (m: Mockup) => void, props?: Omit<MockupProps, 'type'>): Mockup {
  return mockup(childrenFn, { ...props, type: 'browser' });
}

export function codeMockup(childrenFn: (m: Mockup) => void, props?: Omit<MockupProps, 'type'>): Mockup {
  return mockup(childrenFn, { ...props, type: 'code' });
}

export function phoneMockup(childrenFn: (m: Mockup) => void, props?: Omit<MockupProps, 'type'>): Mockup {
  return mockup(childrenFn, { ...props, type: 'phone' });
}

export function windowMockup(childrenFn: (m: Mockup) => void, props?: Omit<MockupProps, 'type'>): Mockup {
  return mockup(childrenFn, { ...props, type: 'window' });
}
