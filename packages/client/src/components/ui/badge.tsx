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
  red: 'border-transparent bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  orange: 'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  amber: 'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
  yellow: 'border-transparent bg-yellow-100 text-yellow-900 dark:bg-yellow-500/15 dark:text-yellow-300',
  green: 'border-transparent bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  emerald: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  teal: 'border-transparent bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
  cyan: 'border-transparent bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300',
  blue: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  indigo: 'border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  violet: 'border-transparent bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  purple: 'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
  pink: 'border-transparent bg-pink-100 text-pink-800 dark:bg-pink-500/15 dark:text-pink-300',
  rose: 'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  gray: 'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300',
  slate: 'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-500/15 dark:text-slate-300',
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
