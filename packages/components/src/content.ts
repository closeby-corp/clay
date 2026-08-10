import { Element } from '@clay/core';

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
