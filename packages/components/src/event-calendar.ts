import { Element } from '@close-by/clay-core';

export type EventCalendarEvent = {
  id: string;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  title: string;
  /** Muted secondary line. */
  description?: string;
  /** CSS color or named token for the day dot. */
  color?: string;
};

export type EventCalendarProps = {
  /** Visible month as ISO `YYYY-MM-DD` (day part ignored). Default: today. */
  month?: string;
  /** Selected day ISO `YYYY-MM-DD`. */
  selected?: string;
  events?: EventCalendarEvent[];
  className?: string;
  onMonthChange?: (month: string) => void;
  onSelect?: (date: string) => void;
  onEventClick?: (eventId: string) => void;
};

/** Month grid with event dots and a day event list (scheduling UX). */
export function eventCalendar(props: EventCalendarProps = {}): Element {
  return new Element('eventCalendar', {
    month: props.month,
    selected: props.selected,
    /** Wire prop — not `events` (reserved for protocol handler names). */
    items: props.events ?? [],
    className: props.className,
    onMonthChange: props.onMonthChange,
    onSelect: props.onSelect,
    onEventClick: props.onEventClick,
  });
}
