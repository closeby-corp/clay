import { Element } from '@close-by/clay-core';

/** Lucide icon + optional text layout shared by several controls. */
export type IconSlotProps = {
  /** Lucide kebab-case name (full set shipped in the client). */
  icon?: string;
  /** Where to place `icon` relative to text. Default `'start'`. */
  iconPosition?: 'start' | 'end';
  /** Extra Tailwind classes on the icon (size defaults by host). */
  iconClassName?: string;
};

export type IconTextProps = IconSlotProps & {
  text?: string;
  /** Flex gap step (maps to `gap-1` / `gap-2` / `gap-3` on the client). Default `2`. */
  gap?: 1 | 2 | 3;
  className?: string;
};

/** Inline icon + text row. Prefer over manual `ui.row` + `ui.icon` + `ui.label`. */
export function iconText(
  text?: string | (() => string),
  props: Omit<IconTextProps, 'text'> = {},
): Element {
  const base: Record<string, unknown> = {
    text: '',
    gap: props.gap ?? 2,
    icon: props.icon,
    iconPosition: props.iconPosition ?? 'start',
    iconClassName: props.iconClassName,
    className: props.className,
  };
  if (typeof text === 'function') {
    return new Element('iconText', base).bindText(text);
  }
  return new Element('iconText', { ...base, text: text ?? '' });
}

export type StatusDotColor =
  | 'emerald'
  | 'green'
  | 'amber'
  | 'yellow'
  | 'red'
  | 'blue'
  | 'muted'
  | string;

export type StatusDotProps = {
  label?: string | (() => string);
  /** Named palette or raw CSS color for the dot. Default `muted`. */
  color?: StatusDotColor;
  /** When set, renders this Lucide icon instead of a colored dot. */
  icon?: string;
  className?: string;
};

/** Status indicator (dot or icon) + label — structured alternative to HTML status spans. */
export function statusDot(props: StatusDotProps = {}): Element {
  const { label, color, icon, className } = props;
  const base: Record<string, unknown> = {
    text: '',
    color: color ?? 'muted',
    icon,
    className,
  };
  if (typeof label === 'function') {
    return new Element('statusDot', base).bindText(label);
  }
  return new Element('statusDot', { ...base, text: label ?? '' });
}

/** Merge icon slot fields into element props when `icon` is set. */
export function withIconSlot<T extends IconSlotProps>(
  props: T,
  target: Record<string, unknown>,
): Record<string, unknown> {
  if (props.icon) target.icon = props.icon;
  if (props.iconPosition) target.iconPosition = props.iconPosition;
  if (props.iconClassName) target.iconClassName = props.iconClassName;
  return target;
}
