import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Emit = (id: string, type: string, value?: unknown) => void;

export function asStyle(style: unknown): CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === 'string') {
    const out: Record<string, string> = {};
    for (const part of style.split(';')) {
      const [key, ...rest] = part.split(':');
      if (!key || rest.length === 0) continue;
      out[key.trim()] = rest.join(':').trim();
    }
    return out as CSSProperties;
  }
  return style as CSSProperties;
}

export function asIdLabelList(raw: unknown): { id: string; label: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const id = String((item as { id?: unknown }).id ?? '').trim();
      const label = String((item as { label?: unknown }).label ?? id).trim();
      if (!id) return null;
      return { id, label };
    })
    .filter((x): x is { id: string; label: string } => x != null);
}

export function formatElapsed(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  return `${Math.floor(s)}s`;
}

export function useElapsed(startedAt: unknown): string | null {
  const [now, setNow] = useState(() => Date.now());
  const start =
    typeof startedAt === 'number'
      ? startedAt
      : typeof startedAt === 'string' && startedAt
        ? Date.parse(startedAt)
        : NaN;

  useEffect(() => {
    if (!Number.isFinite(start)) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [start]);

  if (!Number.isFinite(start)) return null;
  return formatElapsed(now - start);
}

export function BoundShell({
  className,
  style,
  children,
}: {
  className?: string;
  style: unknown;
  children: ReactNode;
}) {
  return (
    <div className={cn('w-full min-w-0', className)} style={asStyle(style)}>
      {children}
    </div>
  );
}
