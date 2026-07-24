import { getCurrentSession } from './context';
import type { NotifyType, ToastPosition } from './protocol';
import type { NotifyOptions } from './session';

export type { NotifyOptions };

export function notify(
  message: string,
  typeOrOptions: NotifyType | NotifyOptions = 'info',
): void {
  getCurrentSession()?.notify(message, typeOrOptions);
}

export function navigate(path: string): void {
  getCurrentSession()?.navigate(path);
}

export type { NotifyType, ToastPosition };
