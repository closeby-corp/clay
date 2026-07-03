import { Component } from '@badui/core';

export interface RadialProgressProps {
  value: number;
  size?: string;
  thickness?: string;
  className?: string;
}

export class RadialProgress extends Component<RadialProgressProps> {
  render(): string {
    const classes = ['radial-progress', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');
    const style = [
      `--value:${Math.min(100, Math.max(0, this.props.value))}`,
      this.props.size ? `--size:${this.props.size}` : '',
      this.props.thickness ? `--thickness:${this.props.thickness}` : '',
    ].filter(Boolean).join(';');

    return `<div id="${this.id}" class="${classes}" style="${style}" role="progressbar"${this.getExtraStyles()}>${this.props.value}%</div>`;
  }
}

export function radialProgress(value: number, props?: Omit<RadialProgressProps, 'value'>): RadialProgress {
  return new RadialProgress({ value, ...props });
}
