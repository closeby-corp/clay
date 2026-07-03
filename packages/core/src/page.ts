import { Component, type Renderable } from './component';
import { getCurrentContext } from './context';
import { createPageState, type PageState } from './page-state';

export type PageContent = string | Renderable;

export interface PageContext {
  state: PageState;
}

export type PageRenderFn = (ctx: PageContext) => PageContent;

/**
 * Wraps a plain render function so the server can treat it like a page component.
 * NiceGUI-style: page('/path', ({ state }) => { ... return ui; })
 */
export class PageComponent extends Component {
  constructor(private renderFn: PageRenderFn) {
    super({});
  }

  render(): string {
    const ctx = getCurrentContext();
    const pageState = ctx ? ctx.getPageState() : createPageState(null);
    const result = this.renderFn({ state: pageState });
    return typeof result === 'string' ? result : result.render();
  }
}

export function toHtml(content: PageContent): string {
  return typeof content === 'string' ? content : content.render();
}
