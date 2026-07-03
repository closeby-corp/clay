import { Component } from '@badui/core';

export type ThemeName = 'light' | 'dark' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate' | 'synthwave' | 'retro' | 'cyberpunk' | 'valentine' | 'halloween' | 'garden' | 'forest' | 'aqua' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe' | 'black' | 'luxury' | 'dracula' | 'cmyk' | 'autumn' | 'business' | 'acid' | 'lemonade' | 'night' | 'coffee' | 'winter' | 'dim' | 'nord' | 'sunset';

export interface ThemeControllerProps {
  value?: ThemeName;
  as?: 'checkbox' | 'toggle' | 'select';
  className?: string;
}

export class ThemeController extends Component<ThemeControllerProps> {
  render(): string {
    const as = this.props.as || 'checkbox';
    const classes = ['theme-controller', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    if (as === 'select') {
      const themes: ThemeName[] = ['light', 'dark', 'cupcake', 'corporate', 'synthwave', 'retro'];
      const options = themes.map((t) => `<option value="${t}" ${this.props.value === t ? 'selected' : ''}>${t}</option>`).join('');
      return `<select id="${this.id}" class="${classes} select" data-theme-controller${this.getExtraStyles()}>${options}</select>`;
    }

    const inputClass = as === 'toggle' ? 'toggle toggle-primary' : 'toggle theme-controller';
    return `<input id="${this.id}" type="checkbox" class="${inputClass}" value="${this.props.value || 'synthwave'}" data-theme-controller${this.getExtraStyles()} />`;
  }
}

export function themeController(props?: ThemeControllerProps): ThemeController {
  return new ThemeController(props ?? {});
}
