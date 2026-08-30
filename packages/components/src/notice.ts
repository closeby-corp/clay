import { Element } from '@close-by/clay-core';
import { type IconSlotProps, withIconSlot } from './icon-text';

export type NoticeVariant = 'default' | 'destructive' | 'warning';

export type NoticeProps = IconSlotProps & {
  message?: string | (() => string);
  variant?: NoticeVariant;
  /** When true, show a dismiss control. */
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void | Promise<void>;
};

/** Dismissible app-wide banner (maintenance, auth expiry, etc.). */
export function notice(message?: string | (() => string), props: Omit<NoticeProps, 'message'> = {}): Element {
  const base = withIconSlot(props, {
    text: typeof message === 'string' ? message : '',
    variant: props.variant ?? 'default',
    dismissible: props.dismissible ?? true,
    className: props.className,
    onDismiss: props.onDismiss,
  });
  if (typeof message === 'function') {
    return new Element('notice', base).bindText(message);
  }
  return new Element('notice', base);
}
