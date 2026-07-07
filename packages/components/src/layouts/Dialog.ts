import { Component } from '@badui/core';

export interface DialogProps {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeButton?: boolean;
  backdrop?: boolean;
  /** Datastar expression for open state, e.g. "$modalOpen" */
  showExpr?: string;
  className?: string;
}

export class Dialog extends Component<DialogProps> {
  render(): string {
    const modalClass = this.props.size ? `modal-${this.props.size}` : '';

    const showAttr = this.props.showExpr ? this.signalShow(this.props.showExpr) : '';

    return `
      <dialog id="${this.id}" class="modal ${modalClass}"${showAttr}${this.patchRegionAttr()}${this.getExtraStyles()}>
        <div class="modal-box ${this.props.className || ''}">
          ${this.props.closeButton !== false ? `
            <form method="dialog">
              <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
          ` : ''}
          
          ${this.props.title ? `<h3 class="font-bold text-lg mb-4">${this.props.title}</h3>` : ''}
          
          <div class="modal-content">
            ${this.renderChildren()}
          </div>
        </div>
        
        ${this.props.backdrop !== false ? `
          <form method="dialog" class="modal-backdrop">
            <button>close</button>
          </form>
        ` : ''}
      </dialog>
    `;
  }
}

export function dialog(children: () => void, props?: DialogProps): Dialog {
  return new Dialog(props || {});
}
