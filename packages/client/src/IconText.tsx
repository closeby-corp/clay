import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { resolveNavIcon } from './icons';

export type IconTextProps = {
  text: string;
  icon?: string;
  iconPosition?: 'start' | 'end';
  iconClassName?: string;
  /** Icon size preset. Default `default` (`size-4`). */
  iconSize?: 'xs' | 'sm' | 'default';
  gap?: 1 | 2 | 3;
  className?: string;
  textClassName?: string;
  style?: CSSProperties;
  as?: 'span' | 'div';
  /** When true and there is no text, expose icon name as aria-label. */
  ariaLabel?: string;
};

function gapClass(gap: 1 | 2 | 3 | undefined): string {
  if (gap === 1) return 'gap-1';
  if (gap === 3) return 'gap-3';
  return 'gap-2';
}

function iconSizeClass(size: IconTextProps['iconSize']): string {
  if (size === 'xs') return 'size-3';
  if (size === 'sm') return 'size-3.5';
  return 'size-4';
}

export function IconText({
  text,
  icon,
  iconPosition = 'start',
  iconClassName,
  iconSize = 'default',
  gap = 2,
  className,
  textClassName,
  style,
  as: Tag = 'span',
  ariaLabel,
}: IconTextProps): ReactNode {
  const Icon = icon ? resolveNavIcon(icon) : null;
  const label = text ?? '';
  const iconOnly = !!Icon && !label;
  const sizeCls = iconSizeClass(iconSize);

  const iconNode =
    Icon != null ? (
      <Icon className={cn(sizeCls, 'shrink-0', iconClassName)} aria-hidden />
    ) : null;

  return (
    <Tag
      className={cn('inline-flex items-center', gapClass(gap), className)}
      style={style}
      aria-label={iconOnly ? (ariaLabel ?? icon) : undefined}
    >
      {Icon && iconPosition === 'start' ? iconNode : null}
      {label ? <span className={cn('min-w-0', textClassName)}>{label}</span> : null}
      {Icon && iconPosition === 'end' ? iconNode : null}
    </Tag>
  );
}

const STATUS_DOT_BG: Record<string, string> = {
  emerald: 'bg-emerald-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  muted: 'bg-muted-foreground/60',
};

export type StatusDotRenderProps = {
  text: string;
  color?: string;
  icon?: string;
  className?: string;
  style?: CSSProperties;
};

export function StatusDot({ text, color, icon, className, style }: StatusDotRenderProps): ReactNode {
  const colorKey = color ?? 'muted';
  const dotClass = STATUS_DOT_BG[colorKey];
  const Icon = icon ? resolveNavIcon(icon) : null;

  return (
    <span className={cn('inline-flex items-center gap-2', className)} style={style}>
      {Icon ? (
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      ) : dotClass ? (
        <span className={cn('size-2 shrink-0 rounded-full', dotClass)} aria-hidden />
      ) : (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: colorKey }}
          aria-hidden
        />
      )}
      {text ? <span className="min-w-0">{text}</span> : null}
    </span>
  );
}
