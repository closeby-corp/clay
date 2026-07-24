import { useEffect, useState } from 'react';
import { useBadUISession } from './useSession';
import { ElementRenderer } from './ElementRenderer';
import type { NotifyType, ToastItem, ToastPosition } from './protocol';
import { cn } from './lib/utils';

const positionClass: Record<ToastPosition, string> = {
  'top-left': 'left-4 top-4 items-start',
  'top-right': 'right-4 top-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-right': 'bottom-4 right-4 items-end',
};

const typeClass: Record<NotifyType, string> = {
  info: 'border-border bg-card text-card-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  error: 'border-destructive/40 bg-destructive text-destructive-foreground',
};

function ToastStack({
  toasts,
  position,
  onDismiss,
}: {
  toasts: ToastItem[];
  position: ToastPosition;
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className={cn('pointer-events-none fixed z-[60] flex w-full max-w-sm flex-col gap-2', positionClass[position])}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg',
            typeClass[toast.type],
          )}
        >
          <div className="flex-1 pt-0.5">{toast.message}</div>
          <button
            type="button"
            className="rounded px-1.5 text-xs opacity-70 hover:opacity-100"
            aria-label="Dismiss"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const { tree, connected, error, toasts, toastPosition, emit, dismissToast } = useBadUISession(path);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      {!connected && (
        <div className="fixed left-4 top-4 z-50 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          Connecting…
        </div>
      )}
      {error && (
        <div className="fixed left-4 top-4 z-50 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}
      <ToastStack toasts={toasts} position={toastPosition} onDismiss={dismissToast} />
      {tree ? <ElementRenderer node={tree} emit={emit} /> : null}
    </>
  );
}
