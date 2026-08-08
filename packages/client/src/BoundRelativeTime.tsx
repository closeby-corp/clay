import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type Emit = (id: string, type: string, value?: unknown) => void;

type TimezoneEntry = string | { zone: string; label?: string };

function asStyle(style: unknown): CSSProperties | undefined {
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

function normalizeZones(raw: unknown): { zone: string; label: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === 'string') {
        const zone = entry.trim();
        if (!zone) return null;
        const label = zone.includes('/') ? (zone.split('/').pop() ?? zone) : zone;
        return { zone, label: label.replace(/_/g, ' ') };
      }
      if (entry && typeof entry === 'object' && 'zone' in entry) {
        const zone = String((entry as { zone: unknown }).zone ?? '').trim();
        if (!zone) return null;
        const custom = (entry as { label?: unknown }).label;
        const label =
          typeof custom === 'string' && custom.trim()
            ? custom.trim()
            : (zone.includes('/') ? (zone.split('/').pop() ?? zone) : zone).replace(/_/g, ' ');
        return { zone, label };
      }
      return null;
    })
    .filter((z): z is { zone: string; label: string } => z != null);
}

function resolveDate(raw: unknown, now: number): Date {
  if (raw == null || raw === '') return new Date(now);
  if (typeof raw === 'number' && Number.isFinite(raw)) return new Date(raw);
  if (typeof raw === 'string') {
    const asNum = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(asNum) && /^\d+(\.\d+)?$/.test(raw.trim())) {
      return new Date(asNum);
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(now);
}

export function BoundRelativeTime({
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
  const live = props.date == null || props.date === '';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [live]);

  const instant = resolveDate(props.date, now);
  const zones = normalizeZones(props.timezones as TimezoneEntry[]);
  const dateStyle = (props.dateStyle as Intl.DateTimeFormatOptions['dateStyle']) ?? 'long';
  const timeStyle = (props.timeStyle as Intl.DateTimeFormatOptions['timeStyle']) ?? 'medium';

  if (zones.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap gap-4 rounded-md border bg-background p-4', className)}
      style={asStyle(style)}
      role="group"
      aria-label="Relative time"
    >
      {zones.map(({ zone, label }) => {
        let dateText = '—';
        let timeText = '—';
        try {
          dateText = new Intl.DateTimeFormat(undefined, { timeZone: zone, dateStyle }).format(instant);
          timeText = new Intl.DateTimeFormat(undefined, { timeZone: zone, timeStyle }).format(instant);
        } catch {
          // Invalid IANA zone — leave placeholders
        }
        return (
          <div key={zone} className="min-w-[8rem] space-y-1">
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
            <div className="text-sm">{dateText}</div>
            <div className="font-mono text-base tabular-nums">{timeText}</div>
          </div>
        );
      })}
    </div>
  );
}
