import { getCurrentSession } from './context';
import type { NotifyType, ToastPosition } from './protocol';
import type { NotifyOptions } from './session';

export type { NotifyOptions };

/**
 * Show a toast on the connected client.
 * Second arg is a type string (`'info'` default) or {@link NotifyOptions}.
 */
export function notify(
  message: string,
  typeOrOptions: NotifyType | NotifyOptions = 'info',
): void {
  getCurrentSession()?.notify(message, typeOrOptions);
}

/** Client-side SPA navigate to `path` (same WebSocket session). */
export function navigate(path: string): void {
  getCurrentSession()?.navigate(path);
}

/** Soft-reconnect the WebSocket so the next hello includes updated cookies. */
export function reconnect(): void {
  getCurrentSession()?.reconnect();
}

/** Trigger a browser download of `content` as `filename` (`mime` type). */
export function download(filename: string, mime: string, content: string): void {
  getCurrentSession()?.download(filename, mime, content);
}

/** Copy `content` to the system clipboard on the client. */
export function clipboard(content: string): void {
  getCurrentSession()?.clipboard(content);
}

export {
  runJavaScript,
  scroll,
  scrollTo,
  scrollIntoView,
  type ScrollBehavior,
  type ScrollToOptions,
  type ScrollIntoViewOptions,
} from './javascript';

export type { NotifyType, ToastPosition };
