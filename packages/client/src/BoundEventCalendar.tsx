import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { format, isSameDay, parseISO, startOfMonth } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useOptimisticValue } from './useOptimisticValue';
import { hasProtocolEvent } from './protocolEvents';

type EventView = {
  id: string;
  date: string;
  title: string;
  description?: string;
  color?: string;
};

function parseDay(raw?: string): Date | undefined {
  if (!raw) return undefined;
  const d = parseISO(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function BoundEventCalendar({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: CSSProperties | undefined;
  emit: (id: string, type: string, value?: unknown) => void;
}) {
  const items = (props.items as EventView[]) ?? [];
  const serverMonth = String(props.month ?? format(new Date(), 'yyyy-MM-dd'));
  const serverSelected = String(props.selected ?? '');
  const [monthIso, setMonthIso] = useOptimisticValue(serverMonth);
  const [selectedIso, setSelectedIso] = useOptimisticValue(serverSelected);

  const monthDate = parseDay(monthIso) ?? new Date();
  const selectedDate = parseDay(selectedIso);

  const eventDates = useMemo(() => {
    const map = new Map<string, EventView[]>();
    for (const ev of items) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [items]);

  const dayEvents = selectedDate
    ? items.filter((ev) => {
        const d = parseDay(ev.date);
        return d && selectedDate && isSameDay(d, selectedDate);
      })
    : [];

  const modifiers = useMemo(() => {
    const dates = [...eventDates.keys()]
      .map((key) => parseDay(key))
      .filter((d): d is Date => !!d);
    return { hasEvent: dates };
  }, [eventDates]);

  return (
    <div className={cn('grid gap-4 md:grid-cols-[auto_1fr]', className)} style={style}>
      <Calendar
        mode="single"
        month={startOfMonth(monthDate)}
        selected={selectedDate}
        onMonthChange={(next) => {
          const iso = format(startOfMonth(next), 'yyyy-MM-dd');
          setMonthIso(iso);
          if (hasProtocolEvent(props, 'monthChange')) emit(id, 'monthChange', iso);
        }}
        onSelect={(day) => {
          const iso = day ? format(day, 'yyyy-MM-dd') : '';
          setSelectedIso(iso);
          if (hasProtocolEvent(props, 'select')) emit(id, 'select', iso);
        }}
        modifiers={modifiers}
        modifiersClassNames={{ hasEvent: 'relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary' }}
        className="rounded-md border"
      />
      <Card className="min-h-[18rem]">
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate ? format(selectedDate, 'PPP') : 'Select a day'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events this day.</p>
          ) : (
            dayEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                className="rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/50"
                onClick={() => {
                  if (hasProtocolEvent(props, 'eventClick')) emit(id, 'eventClick', ev.id);
                }}
              >
                <div className="font-medium">{ev.title}</div>
                {ev.description ? (
                  <div className="text-xs text-muted-foreground">{ev.description}</div>
                ) : null}
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
