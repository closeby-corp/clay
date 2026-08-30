import { useState, type ReactNode } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { resolveNavIcon } from './icons';

export type TimelineItemView = {
  id?: string;
  at?: string;
  title: string;
  description?: string;
  status?: 'pending' | 'active' | 'completed' | 'error';
  icon?: string;
  avatar?: { src?: string; fallback?: string };
  badge?: string;
  badgeColor?: string;
  body?: string;
  defaultOpen?: boolean;
};

function statusRing(status: TimelineItemView['status']): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'active':
      return 'border-primary bg-primary/10 text-primary';
    case 'error':
      return 'border-destructive bg-destructive/10 text-destructive';
    default:
      return 'border-muted-foreground/30 bg-muted text-muted-foreground';
  }
}

function TimelineNode({
  item,
  centered = false,
}: {
  item: TimelineItemView;
  centered?: boolean;
}): ReactNode {
  const Icon = item.icon ? resolveNavIcon(item.icon) : null;
  const avatarFallback = item.avatar?.fallback ?? item.title.slice(0, 1).toUpperCase();

  if (item.avatar?.src || item.avatar?.fallback) {
    return (
      <Avatar className="size-8 border-2 border-background shadow-sm">
        {item.avatar.src ? <AvatarImage src={item.avatar.src} alt="" /> : null}
        <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
      </Avatar>
    );
  }

  if (Icon) {
    return (
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-full border-2',
          statusRing(item.status),
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full ring-4 ring-background',
        centered
          ? 'size-3'
          : 'flex size-3 translate-x-2.5 translate-y-2.5',
        item.status === 'completed'
          ? 'bg-emerald-500'
          : item.status === 'active'
            ? 'bg-primary'
            : item.status === 'error'
              ? 'bg-destructive'
              : 'bg-muted-foreground/40',
      )}
      aria-hidden
    />
  );
}

function TimelineItemRow({ item, last }: { item: TimelineItemView; last: boolean }): ReactNode {
  const [open, setOpen] = useState(!!item.defaultOpen);
  const hasBody = !!item.body?.trim();

  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {item.at ? (
          <time className="text-xs tabular-nums text-muted-foreground">{item.at}</time>
        ) : null}
        {item.badge ? (
          <Badge variant="outline" size="xs" color={item.badgeColor}>
            {item.badge}
          </Badge>
        ) : null}
      </div>
      <div className="font-medium leading-snug">{item.title}</div>
      {item.description ? (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      ) : null}
      {hasBody ? (
        <>
          <CollapsibleTrigger className="text-left text-xs text-primary hover:underline">
            {open ? 'Hide details' : 'Show details'}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-1 max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
              {item.body}
            </pre>
          </CollapsibleContent>
        </>
      ) : null}
    </>
  );

  return (
    <li className="relative flex gap-4">
      {!last ? (
        <span
          className="absolute left-4 top-8 bottom-0 w-px -translate-x-1/2 bg-border"
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1] shrink-0">
        <TimelineNode item={item} />
      </div>
      {hasBody ? (
        <Collapsible open={open} onOpenChange={setOpen} className="min-w-0 flex-1 flex flex-col gap-1 pb-6">
          {content}
        </Collapsible>
      ) : (
        <div className="min-w-0 flex-1 flex flex-col gap-1 pb-6">{content}</div>
      )}
    </li>
  );
}

export function Timeline({
  items,
  orientation = 'vertical',
  className,
  style,
}: {
  items: TimelineItemView[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}): ReactNode {
  if (orientation === 'horizontal') {
    const trackInset = items.length > 1 ? 'left-[calc(100%/6)] right-[calc(100%/6)]' : '';
    return (
      <div className={cn('relative w-full', className)} style={style}>
        {items.length > 1 ? (
          <div
            className={cn(
              'pointer-events-none absolute top-[5px] h-0.5 bg-muted-foreground/30',
              trackInset,
            )}
            aria-hidden
          />
        ) : null}
        <ol className="relative m-0 flex w-full list-none items-start p-0" aria-label="Timeline">
          {items.map((item, i) => (
            <li
              key={item.id ?? i}
              className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
            >
              <div className="relative z-[1] bg-background px-2">
                <TimelineNode item={item} centered />
              </div>
              <div className="px-1">
                <div className="text-xs font-medium">{item.title}</div>
                {item.at ? (
                  <div className="text-[10px] text-muted-foreground">{item.at}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <ol className={cn('relative m-0 list-none p-0', className)} style={style} aria-label="Timeline">
      {items.map((item, i) => (
        <TimelineItemRow key={item.id ?? i} item={item} last={i === items.length - 1} />
      ))}
    </ol>
  );
}

export function StepperView({
  steps,
  index,
  orientation,
  showNav,
  onIndexChange,
  renderStepBody,
  className,
  style,
}: {
  steps: Array<{ id: string; title?: string; description?: string; icon?: string; status?: string; className?: string }>;
  index: number;
  orientation: 'horizontal' | 'vertical';
  showNav: boolean;
  onIndexChange: (next: number) => void;
  renderStepBody: (stepIndex: number) => ReactNode;
  className?: string;
  style?: React.CSSProperties;
}): ReactNode {
  const active = Math.min(Math.max(0, index), Math.max(0, steps.length - 1));

  const inferStatus = (i: number, explicit?: string) => {
    if (explicit && explicit !== 'pending') return explicit;
    if (i < active) return 'completed';
    if (i === active) return explicit === 'loading' ? 'loading' : explicit === 'error' ? 'error' : 'active';
    return 'pending';
  };

  const StepIndicator = ({ i }: { i: number }) => {
    const step = steps[i]!;
    const status = inferStatus(i, step.status);
    const Icon = step.icon ? resolveNavIcon(step.icon) : null;

    let inner: ReactNode;
    if (status === 'completed') {
      inner = <Check className="size-4" aria-hidden />;
    } else if (status === 'loading') {
      inner = <Loader2 className="size-4 animate-spin" aria-hidden />;
    } else if (status === 'error') {
      inner = <X className="size-4" aria-hidden />;
    } else if (Icon) {
      inner = <Icon className="size-4" aria-hidden />;
    } else {
      inner = <span className="text-xs font-semibold">{i + 1}</span>;
    }

    return (
      <button
        type="button"
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          status === 'completed' && 'border-emerald-500 bg-emerald-500 text-white',
          status === 'active' && 'border-primary bg-primary text-primary-foreground',
          status === 'error' && 'border-destructive bg-destructive text-white',
          status === 'loading' && 'border-primary bg-background text-primary',
          status === 'pending' && 'border-muted-foreground/30 bg-muted text-muted-foreground',
          i <= active && 'cursor-pointer hover:opacity-90',
        )}
        disabled={i > active}
        onClick={() => {
          if (i <= active) onIndexChange(i);
        }}
        aria-current={i === active ? 'step' : undefined}
        aria-label={step.title ? `Step ${i + 1}: ${step.title}` : `Step ${i + 1}`}
      >
        {inner}
      </button>
    );
  };

  const navRow =
    orientation === 'vertical' ? (
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepIndicator i={i} />
              {i < steps.length - 1 ? <div className="my-1 w-px flex-1 min-h-6 bg-border" /> : null}
            </div>
            <div className={cn('pb-6 min-w-0', i === active ? 'font-medium' : 'text-muted-foreground')}>
              <div className="text-sm">{step.title ?? `Step ${i + 1}`}</div>
              {step.description ? (
                <div className="text-xs text-muted-foreground">{step.description}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex items-start w-full">
        {steps.map((step, i) => (
          <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              {i > 0 ? <div className="h-px flex-1 bg-border" /> : <div className="flex-1" />}
              <StepIndicator i={i} />
              {i < steps.length - 1 ? <div className="h-px flex-1 bg-border" /> : <div className="flex-1" />}
            </div>
            <div className={cn('px-1 text-center', i === active ? 'font-medium' : 'text-muted-foreground')}>
              <div className="text-sm leading-tight">{step.title ?? `Step ${i + 1}`}</div>
              {step.description ? (
                <div className="text-xs text-muted-foreground line-clamp-2">{step.description}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );

  const navButtons =
    showNav && steps.length > 1 ? (
      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
          disabled={active <= 0}
          onClick={() => onIndexChange(active - 1)}
        >
          Back
        </button>
        <span className="text-xs text-muted-foreground">
          Step {active + 1} of {steps.length}
        </span>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline disabled:opacity-40"
          disabled={active >= steps.length - 1}
          onClick={() => onIndexChange(active + 1)}
        >
          Next
        </button>
      </div>
    ) : null;

  return (
    <div className={cn('flex flex-col gap-6', className)} style={style} data-slot="stepper">
      {navRow}
      <div className="rounded-lg border bg-card p-4 shadow-xs">{renderStepBody(active)}</div>
      {navButtons}
    </div>
  );
}
