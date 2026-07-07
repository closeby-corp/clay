import { Component } from '@badui/core';

export interface SkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
}

export class Skeleton extends Component<SkeletonProps> {
  render(): string {
    const classes = ['skeleton', this.props.circle ? 'rounded-full' : '', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');
    const style = [
      this.props.width ? `width:${this.props.width}` : 'width:100%',
      this.props.height ? `height:${this.props.height}` : 'height:1rem',
    ].join(';');

    return `<div id="${this.id}" class="${classes}" style="${style}"${this.patchRegionAttr()}${this.getExtraStyles()}></div>`;
  }
}

export function skeleton(props?: SkeletonProps): Skeleton {
  return new Skeleton(props ?? {});
}
