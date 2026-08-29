import { Element } from '@close-by/clay-core';

export type MarkdownProps = {
  className?: string;
};

/** Client renders Markdown via a small lib + sanitize. */
export function markdown(text?: string, props: MarkdownProps = {}): Element {
  return new Element('markdown', {
    text: text ?? '',
    className: props.className,
  });
}

export type HtmlProps = {
  className?: string;
};

/**
 * Trusted server HTML into a container.
 * Same XSS trust model as NiceGUI: only pass HTML you control.
 */
export function html(content?: string, props: HtmlProps = {}): Element {
  return new Element('html', {
    html: content ?? '',
    className: props.className,
  });
}

export type ImageProps = {
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
};

/** `<img>` element; `src` is a URL or path. */
export function image(src: string, props: ImageProps = {}): Element {
  return new Element('image', {
    src,
    alt: props.alt ?? '',
    className: props.className,
    width: props.width,
    height: props.height,
  });
}

export type IframeProps = {
  /** Accessible name for the frame. */
  title?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  /** `iframe` `allow` attribute (feature policy). */
  allow?: string;
  /** `iframe` `sandbox` tokens (space-separated string or list). */
  sandbox?: string | string[];
  loading?: 'eager' | 'lazy';
  referrerPolicy?: string;
};

/**
 * First-class iframe embed (prefer over `ui.html(\`<iframe…>\`)`).
 * `src` is a URL; only embed origins you trust.
 */
export function iframe(src: string, props: IframeProps = {}): Element {
  const sandbox = Array.isArray(props.sandbox) ? props.sandbox.join(' ') : props.sandbox;
  return new Element('iframe', {
    src,
    title: props.title ?? '',
    className: props.className,
    width: props.width,
    height: props.height,
    allow: props.allow,
    sandbox,
    loading: props.loading,
    referrerPolicy: props.referrerPolicy,
  });
}
