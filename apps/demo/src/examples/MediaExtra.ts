import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Media Extra',
  icon: 'layers',
  order: 88,
};

ui.page('/examples/media-extra', () => {
  const crop = ui.state({
    preview: '' as string,
  });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.relativeTime, ui.qrCode, ui.imageZoom, ui.imageCrop, and ui.iframe — media helpers.',
        );

        exampleSection(
          'Relative time',
          'ui.relativeTime — multi-timezone clock; ticks every second when date is omitted.',
        );
        ui.relativeTime({
          timezones: [
            { zone: 'America/New_York', label: 'EST' },
            { zone: 'Europe/London', label: 'GMT' },
            { zone: 'Asia/Tokyo', label: 'JST' },
          ],
        });

        ui.separator();

        exampleSection(
          'Fixed instant',
          'Pass date to freeze the clock (no live tick).',
        );
        ui.relativeTime({
          date: '2026-08-08T12:00:00Z',
          timezones: ['UTC', 'America/Los_Angeles'],
          dateStyle: 'full',
          timeStyle: 'short',
        });

        ui.separator();

        exampleSection('QR code', 'ui.qrCode — SVG from a string (error-correction level M by default).');
        ui.row(
          () => {
            ui.qrCode({ value: 'https://example.com', size: 160 });
            ui.qrCode({ value: 'clay://hello', size: 120, level: 'H' });
          },
          { gap: 6 },
        );

        ui.separator();

        exampleSection(
          'Image zoom',
          'ui.imageZoom — click for a zoom overlay (plain ui.image stays non-interactive).',
        );
        ui.imageZoom({
          src: 'https://picsum.photos/seed/clay-zoom/640/360',
          alt: 'Sample photo (click to zoom)',
          className: 'max-w-md',
        });

        ui.separator();

        exampleSection(
          'Image crop',
          'ui.imageCrop — drag/zoom the crop area, then Crop to emit a data URL preview.',
        );
        ui.imageCrop({
          src: 'https://picsum.photos/seed/clay-crop/800/600',
          aspect: 1,
          onCrop: (payload) => {
            crop.preview = payload.dataUrl;
            ui.notify('Cropped', 'success');
          },
        });
        ui.auto(() => {
          if (!crop.preview) {
            ui.label('Preview appears here after Crop.').classes('text-sm text-muted-foreground');
            return;
          }
          ui.column(
            () => {
              ui.label('Cropped preview').classes('text-sm font-medium');
              ui.image(crop.preview).classes('max-w-xs rounded-md border');
            },
            { gap: 2 },
          );
        });

        ui.separator();

        exampleSection(
          'Iframe',
          'ui.iframe — first-class embed (prefer over ui.html with an iframe tag).',
        );
        ui.iframe('https://example.com', {
          title: 'Example embed',
          height: 220,
          className: 'max-w-xl border rounded-md',
          loading: 'lazy',
        });
      },
      { gap: 6 },
    );
  });
});
