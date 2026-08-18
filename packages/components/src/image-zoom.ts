import { Element } from '@close-by/clay-core';

export type ImageZoomProps = {
  src: string;
  alt?: string;
  className?: string;
};

/**
 * Image with a click-to-zoom overlay.
 * Leave plain `ui.image` unchanged for non-interactive images.
 */
export function imageZoom(props: ImageZoomProps): Element {
  return new Element('imageZoom', {
    src: props.src ?? '',
    alt: props.alt ?? '',
    className: props.className,
  });
}
