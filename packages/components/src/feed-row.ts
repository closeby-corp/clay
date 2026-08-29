import { Element, withParent } from '@close-by/clay-core';
import { statusDot, type StatusDotColor } from './icon-text';

type LayoutProps = {
  gap?: string | number;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
};

function layout(
  type: string,
  props: LayoutProps,
  fn?: () => void,
): Element {
  const el = new Element(type, {
    gap: props.gap ?? 2,
    className: props.className,
    width: props.width,
  });
  if (fn) withParent(el, fn);
  return el;
}

function feedLabel(text: string | (() => string), className?: string): Element {
  if (typeof text === 'function') {
    return new Element('label', { text: '', className }).bindText(text);
  }
  return new Element('label', { text, className });
}

function feedButton(
  text: string | (() => string),
  props: {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    onClick?: () => void | Promise<void>;
  },
): Element {
  const base = {
    text: '',
    variant: props.variant ?? 'default',
    size: props.size ?? 'default',
    className: props.className,
    onClick: props.onClick,
  };
  if (typeof text === 'function') {
    return new Element('button', base).bindText(text);
  }
  return new Element('button', { ...base, text });
}

export type FeedRowStatus = {
  /** Named palette or CSS color — same as `ui.statusDot`. */
  color?: StatusDotColor;
  /** Lucide icon instead of a dot. */
  icon?: string;
  className?: string;
};

export type FeedRowProps = {
  /** Highlight row as selected (master–detail feeds). */
  selected?: boolean;
  /** Leading status dot or icon. */
  status?: FeedRowStatus;
  /** Primary link-style title. */
  title: string | (() => string);
  onClick?: () => void | Promise<void>;
  /** Muted secondary line under the title. */
  meta?: string | (() => string);
  /** Destructive secondary line (errors, failed outcomes). */
  issue?: string | (() => string);
  /** Muted fallback when there is no issue or footer content. */
  hint?: string | (() => string);
  /** Small trailing marker on the title row (e.g. `new`). */
  marker?: string;
  /** Right column — usually relative/absolute time. */
  trailing?: string | (() => string);
  onTrailingClick?: () => void | Promise<void>;
  className?: string;
};

export type FeedListProps = {
  className?: string;
};

/** Bordered, divided container for live feed rows. App owns items and polling. */
export function feedList(props: FeedListProps, fn: () => void): Element;
export function feedList(fn: () => void): Element;
export function feedList(
  propsOrFn: FeedListProps | (() => void),
  fn?: () => void,
): Element {
  if (typeof propsOrFn === 'function') {
    return feedList({}, propsOrFn);
  }
  const extra = propsOrFn.className?.trim();
  return layout(
    'container',
    {
      width: 'full',
      className: ['rounded-md border divide-y overflow-hidden p-0 flex-1', extra]
        .filter(Boolean)
        .join(' '),
    },
    fn,
  );
}

/**
 * One selectable live-feed row (status dot, link title, meta/issue/hint, trailing time).
 * Does not own items — wrap a `for` loop in `ui.auto` or reactive-let. Not `ui.list`.
 */
export function feedRow(props: FeedRowProps, footer?: () => void): Element {
  const rowClass = [
    'items-center px-3 py-2 text-sm transition-colors',
    props.selected ? 'bg-primary/10' : 'hover:bg-muted/40',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');

  return layout('row', { gap: 2, className: rowClass }, () => {
    if (props.status) {
      statusDot({
        color: props.status.color ?? 'muted',
        icon: props.status.icon,
        className: props.status.className ?? 'shrink-0 pt-0.5',
      });
    }

    layout('column', { gap: 0, className: 'min-w-0 flex-1' }, () => {
      layout('row', { gap: 2, className: 'items-center min-w-0' }, () => {
        feedButton(props.title, {
          size: 'sm',
          variant: 'link',
          className: [
            'h-auto p-0 justify-start font-normal truncate max-w-full',
            props.selected ? 'text-foreground font-medium' : 'text-foreground',
          ].join(' '),
          onClick: props.onClick,
        });
        if (props.marker) {
          feedLabel(props.marker).classes(
            'shrink-0 text-[10px] uppercase tracking-wide text-primary font-medium',
          );
        }
      });

      if (props.meta) {
        feedLabel(props.meta).classes('text-xs text-muted-foreground truncate');
      }
      if (props.issue) {
        feedLabel(props.issue).classes('text-xs text-destructive truncate');
      } else if (footer) {
        footer();
      } else if (props.hint) {
        feedLabel(props.hint).classes('text-xs text-muted-foreground truncate');
      }
    });

    if (props.trailing) {
      feedButton(props.trailing, {
        size: 'sm',
        variant: 'link',
        className: 'h-auto shrink-0 p-0 text-xs text-muted-foreground hover:text-foreground',
        onClick: props.onTrailingClick,
      });
    }
  });
}
