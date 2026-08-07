import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type ConnectionStatusProps = {
  connected: boolean;
  /** True once a UI tree has been received (distinguishes first connect vs reconnect). */
  hasTree: boolean;
};

type Phase = 'idle' | 'connecting' | 'reconnecting' | 'ready';

const READY_FLASH_MS = 1200;

/**
 * Fixed corner chip for BadUI connection state.
 * Quiet when connected; pulses while (re)connecting; brief “ready” after recover.
 * Routine reloads should use this instead of toast spam.
 */
export function ConnectionStatus({ connected, hasTree }: ConnectionStatusProps) {
  const [flashReady, setFlashReady] = useState(false);
  const wasDown = useRef(true);

  useEffect(() => {
    if (connected) {
      if (wasDown.current) {
        wasDown.current = false;
        setFlashReady(true);
        const t = setTimeout(() => setFlashReady(false), READY_FLASH_MS);
        return () => clearTimeout(t);
      }
      return;
    }
    wasDown.current = true;
    setFlashReady(false);
  }, [connected]);

  const phase: Phase = !connected
    ? hasTree
      ? 'reconnecting'
      : 'connecting'
    : flashReady
      ? 'ready'
      : 'idle';

  const label =
    phase === 'connecting'
      ? 'connecting'
      : phase === 'reconnecting'
        ? 'reconnecting'
        : phase === 'ready'
          ? 'ready'
          : null;

  const busy = phase === 'connecting' || phase === 'reconnecting';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ? `BadUI ${label}` : 'BadUI connected'}
      className={cn(
        'pointer-events-none fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur-sm transition-colors',
        phase === 'idle' &&
          'border-sky-500/40 bg-background/90 text-sky-800 dark:text-sky-300',
        busy &&
          'border-amber-500/40 bg-background/90 text-amber-800 dark:text-amber-300',
        phase === 'ready' &&
          'border-emerald-500/40 bg-background/90 text-emerald-800 dark:text-emerald-300',
      )}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          phase === 'idle' && 'bg-sky-500',
          busy && 'animate-pulse bg-amber-500',
          phase === 'ready' && 'bg-emerald-500',
        )}
      />
      <span className="tracking-tight">BadUI</span>
      {label ? (
        <span className="text-[10px] font-normal opacity-80">{label}</span>
      ) : null}
    </div>
  );
}
