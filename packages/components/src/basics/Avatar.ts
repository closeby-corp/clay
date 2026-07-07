import { Component } from '@badui/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  placeholder?: string;
  online?: boolean;
  offline?: boolean;
  size?: AvatarSize;
  ring?: boolean;
  className?: string;
}

export class Avatar extends Component<AvatarProps> {
  render(): string {
    const classes = [
      'avatar',
      this.props.online ? 'avatar-online' : '',
      this.props.offline ? 'avatar-offline' : '',
      this.props.size ? `avatar-${this.props.size}` : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const img = this.props.src
      ? `<img src="${this.props.src}" alt="${this.props.alt || ''}" />`
      : `<div class="bg-neutral text-neutral-content flex items-center justify-center"><span>${this.props.placeholder || '?'}</span></div>`;

    const ringClass = this.props.ring ? ' ring ring-primary ring-offset-base-100 ring-offset-2' : '';

    return `<div id="${this.id}" class="${classes}${ringClass}"${this.patchRegionAttr()}${this.getExtraStyles()}>${this.renderChildren() || `<div>${img}</div>`}</div>`;
  }
}

export function avatar(props?: AvatarProps): Avatar {
  return new Avatar(props ?? {});
}
