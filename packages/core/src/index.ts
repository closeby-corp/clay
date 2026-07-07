export * from './component';
export * from './page';
export * from './state';
export * from './reactive';
export * from './router';
export * from './events';
export * from './utils';
export * from './computed';
export * from './global-state';
export * from './context';
export * from './signals';
export * from './background';
export * from './page-state';

import { getCurrentContext } from './context';
import { readReactive } from './reactive';

export { readReactive };
export type { PageContext, PageState, PageRenderFn } from './page';

/**
 * Check if an object is reactive (state proxy or value component).
 */
export function isReactive(obj: unknown): obj is { get(): unknown; set(value: unknown): void; toString(): string } {
  return !!obj && typeof obj === 'object' && typeof (obj as { get?: unknown }).get === 'function';
}

/**
 * Show a toast notification to the user
 */
export function notify(
  message: string, 
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  options: { duration?: number; position?: string } = {}
): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.notify(message, type, options);
  }
}

/**
 * Execute JavaScript code on the client
 */
export function runJavascript(code: string): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.runJavascript(code);
  }
}

/**
 * Navigate to a different page
 */
export function navigate(path: string): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.navigate(path);
  }
}

/**
 * Open a dialog/modal by ID
 */
export function openDialog(dialogId: string): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.openDialog(dialogId);
  }
}

/**
 * Close a dialog/modal by ID
 */
export function closeDialog(dialogId: string): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.closeDialog(dialogId);
  }
}

/**
 * Create a timer that calls a callback at regular intervals.
 * Returns a timer ID that can be used to cancel it.
 */
export function timer(
  callback: () => void, 
  intervalMs: number, 
  options: { immediate?: boolean; once?: boolean } = {}
): string | null {
  const ctx = getCurrentContext();
  if (ctx) {
    return ctx.timer(callback, intervalMs, options);
  }
  return null;
}

/**
 * Cancel a timer by ID
 */
export function cancelTimer(timerId: string): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.cancelTimer(timerId);
  }
}

/**
 * Show a loading overlay on the client
 */
export function showLoading(text?: string): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.showLoading(text);
  }
}

/**
 * Hide the loading overlay
 */
export function hideLoading(): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.hideLoading();
  }
}
