import { Element } from '@close-by/clay-core';

export type QrCodeLevel = 'L' | 'M' | 'Q' | 'H';

export type QrCodeProps = {
  /** String encoded in the QR (URL, text, etc.). */
  value: string;
  /** Rendered SVG width/height in px (default 160). */
  size?: number;
  /** Error-correction level (default `M`). */
  level?: QrCodeLevel;
  className?: string;
};

/** SVG QR code from a string (display-only). */
export function qrCode(props: QrCodeProps): Element {
  return new Element('qrCode', {
    value: props.value ?? '',
    size: props.size ?? 160,
    level: props.level ?? 'M',
    className: props.className,
  });
}
