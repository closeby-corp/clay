import { getCurrentSession } from './context';

export function notify(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
): void {
  getCurrentSession()?.notify(message, type);
}

export function navigate(path: string): void {
  getCurrentSession()?.navigate(path);
}
