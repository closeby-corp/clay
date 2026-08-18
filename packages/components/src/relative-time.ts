import { Element } from '@close-by/clay-core';

export type RelativeTimeDateStyle = 'full' | 'long' | 'medium' | 'short';
export type RelativeTimeTimeStyle = 'full' | 'long' | 'medium' | 'short';

export type RelativeTimeTimezone =
  | string
  | {
      /** IANA timezone id, e.g. `America/New_York`. */
      zone: string;
      /** Optional display label (defaults to the zone's last segment). */
      label?: string;
    };

export type RelativeTimeProps = {
  /**
   * Fixed instant to display (ISO string or epoch ms).
   * When omitted, the client ticks every second using “now”.
   */
  date?: string | number;
  /** One or more IANA timezones (or `{ zone, label? }`). */
  timezones: RelativeTimeTimezone[];
  dateStyle?: RelativeTimeDateStyle;
  timeStyle?: RelativeTimeTimeStyle;
  className?: string;
};

/** Multi-timezone clock (display-only). */
export function relativeTime(props: RelativeTimeProps): Element {
  return new Element('relativeTime', {
    date: props.date,
    timezones: props.timezones ?? [],
    dateStyle: props.dateStyle ?? 'long',
    timeStyle: props.timeStyle ?? 'medium',
    className: props.className,
  });
}
