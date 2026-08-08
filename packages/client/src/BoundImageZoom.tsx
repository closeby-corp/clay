import { useState, type CSSProperties } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Emit = (id: string, type: string, value?: unknown) => void;

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

export function BoundImageZoom({
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
  const src = String(props.src ?? '');
  const alt = String(props.alt ?? '');
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        className={cn(
          'group inline-block max-w-full cursor-zoom-in overflow-hidden rounded-md border bg-transparent p-0',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          className,
        )}
        style={asStyle(style)}
        onClick={() => setOpen(true)}
        aria-label={alt ? `Zoom image: ${alt}` : 'Zoom image'}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto transition-transform duration-200 group-hover:scale-[1.02]"
          draggable={false}
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(96vw,56rem)] border-none bg-transparent p-2 shadow-none sm:p-4">
          <DialogTitle className="sr-only">{alt || 'Zoomed image'}</DialogTitle>
          <img
            src={src}
            alt={alt}
            className="mx-auto max-h-[85vh] w-auto max-w-full rounded-md object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
