import type { CSSProperties, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

/** Soft tinted badges for named colors. */
const namedColorClass: Record<string, string> = {
  red: 'border-transparent bg-red-100 text-red-800',
  orange: 'border-transparent bg-orange-100 text-orange-800',
  amber: 'border-transparent bg-amber-100 text-amber-900',
  yellow: 'border-transparent bg-yellow-100 text-yellow-900',
  green: 'border-transparent bg-green-100 text-green-800',
  emerald: 'border-transparent bg-emerald-100 text-emerald-800',
  teal: 'border-transparent bg-teal-100 text-teal-800',
  cyan: 'border-transparent bg-cyan-100 text-cyan-800',
  blue: 'border-transparent bg-blue-100 text-blue-800',
  indigo: 'border-transparent bg-indigo-100 text-indigo-800',
  violet: 'border-transparent bg-violet-100 text-violet-800',
  purple: 'border-transparent bg-purple-100 text-purple-800',
  pink: 'border-transparent bg-pink-100 text-pink-800',
  rose: 'border-transparent bg-rose-100 text-rose-800',
  gray: 'border-transparent bg-gray-100 text-gray-800',
  slate: 'border-transparent bg-slate-100 text-slate-800',
};

function isCssColor(color: string): boolean {
  return /^(#|rgb|hsl|oklch|var\()/i.test(color.trim());
}

export function Badge({
  className,
  variant,
  color,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants> & {
    color?: string;
  }) {
  const named = color ? namedColorClass[color.toLowerCase()] : undefined;
  const customStyle: CSSProperties | undefined =
    color && !named && isCssColor(color)
      ? {
          backgroundColor: color,
          borderColor: 'transparent',
          color: '#fff',
          ...style,
        }
      : style;

  return (
    <div
      className={cn(
        badgeVariants({ variant: color ? undefined : variant }),
        named,
        color && !named && isCssColor(color) && 'border-transparent',
        className,
      )}
      style={customStyle}
      {...props}
    />
  );
}
