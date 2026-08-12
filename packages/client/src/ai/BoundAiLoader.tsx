import { cn } from '@/lib/utils';
import { BoundShell, useElapsed, type Emit } from './shared';

function PixelGrid() {
  return (
    <div className="grid grid-cols-4 gap-0.5" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          className="size-1.5 rounded-[1px] bg-foreground/70 animate-pulse"
          style={{ animationDelay: `${(i % 4) * 80}ms` }}
        />
      ))}
    </div>
  );
}

function Dots() {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-foreground/80 animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function Orbit() {
  return (
    <div className="relative size-5" aria-hidden>
      <span className="absolute inset-0 rounded-full border border-muted-foreground/30" />
      <span className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground animate-spin [animation-duration:1.2s] origin-[50%_10px]" />
    </div>
  );
}

function Drive() {
  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
      <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-foreground/70" />
    </div>
  );
}

export function BoundAiLoader({
  props,
  className,
  style,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const label = String(props.label ?? 'Working');
  const variant = String(props.variant ?? 'dots');
  const elapsed = useElapsed(props.startedAt);

  const visual =
    variant === 'pixel' ? (
      <PixelGrid />
    ) : variant === 'orbit' ? (
      <Orbit />
    ) : variant === 'drive' ? (
      <Drive />
    ) : (
      <Dots />
    );

  return (
    <BoundShell className={className} style={style}>
      <div
        className={cn(
          'inline-flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs',
        )}
        role="status"
        aria-live="polite"
      >
        {visual}
        <span className="font-medium">{label}</span>
        {elapsed ? (
          <span className="tabular-nums text-muted-foreground">{elapsed}</span>
        ) : null}
      </div>
    </BoundShell>
  );
}
