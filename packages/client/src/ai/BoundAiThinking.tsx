import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Code2, ListOrdered, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BoundShell, type Emit } from './shared';

type Step = {
  kind?: string;
  title: string;
  detail?: string;
  durationMs?: number;
};

function kindIcon(kind?: string) {
  switch (kind) {
    case 'search':
      return Search;
    case 'coding':
      return Code2;
    case 'steps':
      return ListOrdered;
    default:
      return Sparkles;
  }
}

export function BoundAiThinking({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const title = String(props.title ?? 'Thinking');
  const steps = Array.isArray(props.steps) ? (props.steps as Step[]) : [];
  const serverOpen = !!props.open;
  const [open, setOpen] = useState(serverOpen);

  useEffect(() => {
    setOpen(serverOpen);
  }, [serverOpen]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    emit(id, 'toggle', next);
  };

  return (
    <BoundShell className={className} style={style}>
      <div className="rounded-lg border bg-muted/30 text-sm">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground"
          onClick={toggle}
          aria-expanded={open}
        >
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <span>{title}</span>
          {steps.length ? (
            <span className="ml-auto text-xs tabular-nums">{steps.length}</span>
          ) : null}
        </button>
        {open ? (
          <ul className="space-y-2 border-t px-3 py-2">
            {steps.map((step, i) => {
              const Icon = kindIcon(step.kind);
              return (
                <li key={`${step.title}-${i}`} className="flex gap-2">
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-foreground">{step.title}</span>
                      {typeof step.durationMs === 'number' ? (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {(step.durationMs / 1000).toFixed(1)}s
                        </span>
                      ) : null}
                    </div>
                    {step.detail ? (
                      <p className="text-xs text-muted-foreground">{step.detail}</p>
                    ) : null}
                    {step.kind ? (
                      <span
                        className={cn(
                          'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground bg-background border',
                        )}
                      >
                        {step.kind}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </BoundShell>
  );
}
