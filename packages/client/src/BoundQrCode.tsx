import { useEffect, useState, type CSSProperties } from 'react';
import QRCode from 'qrcode';
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

export function BoundQrCode({
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
  const value = String(props.value ?? '');
  const size = typeof props.size === 'number' && props.size > 0 ? props.size : 160;
  const level = (['L', 'M', 'Q', 'H'].includes(String(props.level))
    ? String(props.level)
    : 'M') as 'L' | 'M' | 'Q' | 'H';
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setError(false);
    if (!value) {
      setError(true);
      return;
    }
    void (async () => {
      try {
        const next = await QRCode.toString(value, {
          type: 'svg',
          width: size,
          margin: 1,
          errorCorrectionLevel: level,
        });
        if (!cancelled) setSvg(next);
      } catch {
        if (!cancelled) {
          setSvg(null);
          setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size, level]);

  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      style={asStyle(style)}
      role="img"
      aria-label={value ? `QR code for ${value}` : 'QR code'}
    >
      {svg ? (
        <div
          className="[&>svg]:h-auto [&>svg]:w-full"
          style={{ width: size, height: size }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-md border bg-muted/40 text-xs text-muted-foreground"
          style={{ width: size, height: size }}
        >
          {error ? 'Invalid QR' : '…'}
        </div>
      )}
    </div>
  );
}
