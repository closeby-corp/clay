import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { CSSProperties } from 'react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
      },
      size: {
        default: 'px-2 py-0.5 text-xs [&>svg]:size-3',
        xs: 'h-5 px-1.5 py-0 text-[10px] leading-none [&>svg]:size-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

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

function Badge({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  color,
  style,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    color?: string;
  }) {
  const Comp = asChild ? Slot.Root : 'span';
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
    <Comp
      data-slot="badge"
      data-variant={color ? undefined : variant}
      className={cn(
        badgeVariants({ variant: color ? undefined : variant, size }),
        named,
        color && !named && isCssColor(color) && 'border-transparent',
        className,
      )}
      style={customStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
