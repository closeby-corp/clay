import type { Component } from '@ralph/core';

export interface OOBUpdate {
  componentId: string;
  html: string;
  swap?: string;
}

/**
 * Render a component with Out-of-Band (OOB) updates
 * This allows updating multiple components in a single HTMX response
 */
export function renderWithOOB(
  primaryComponent: Component,
  oobUpdates: OOBUpdate[] = []
): string {
  const primaryHTML = primaryComponent.render();
  
  if (oobUpdates.length === 0) {
    return primaryHTML;
  }

  const oobHTML = oobUpdates.map(update => {
    const swap = update.swap || 'outerHTML';
    return `<div id="${update.componentId}" hx-swap-oob="${swap}">${update.html}</div>`;
  }).join('\n');

  return `${primaryHTML}\n${oobHTML}`;
}

/**
 * Generate OOB update markup for a single component
 */
export function oobUpdate(componentId: string, html: string, swap: string = 'outerHTML'): string {
  return `<div id="${componentId}" hx-swap-oob="${swap}">${html}</div>`;
}

/**
 * Create multiple OOB updates from components
 */
export function createOOBUpdates(components: Component[]): OOBUpdate[] {
  return components.map(component => ({
    componentId: component.id,
    html: component.render()
  }));
}
