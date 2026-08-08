import { useState, type CSSProperties } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Button } from '@/components/ui/button';
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

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

async function getCroppedDataUrl(
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return canvas.toDataURL('image/jpeg');
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

export function BoundImageCrop({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const src = String(props.src ?? '');
  const aspect =
    typeof props.aspect === 'number' && props.aspect > 0 ? props.aspect : undefined;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const applyCrop = async () => {
    if (!src || !croppedAreaPixels || !hasEvent(props, 'crop')) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedDataUrl(src, croppedAreaPixels);
      emit(id, 'crop', { dataUrl });
    } catch (err) {
      console.error('imageCrop failed', err);
    } finally {
      setBusy(false);
    }
  };

  if (!src) return null;

  return (
    <div className={cn('flex w-full max-w-lg flex-col gap-3', className)} style={asStyle(style)}>
      <div className="relative h-64 w-full overflow-hidden rounded-md border bg-muted">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </label>
        {hasEvent(props, 'crop') ? (
          <Button type="button" size="sm" disabled={busy || !croppedAreaPixels} onClick={applyCrop}>
            {busy ? 'Cropping…' : 'Crop'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
