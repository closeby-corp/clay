import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Content & media',
  icon: 'file-text',
  order: 53,
  group: 'Components',
  groupIcon: 'component',
};

const CALENDAR_EVENTS = [
  {
    id: '1',
    date: '2026-08-28',
    title: 'Design review',
    description: 'Dashboard updates',
  },
  {
    id: '2',
    date: '2026-08-30',
    title: 'Release 0.2.9',
    description: 'Release checklist',
  },
  {
    id: '3',
    date: '2026-08-30',
    title: 'Team sync',
    description: 'Weekly planning',
  },
];

ui.page('/examples/content', () => {
  const treeState = ui.state({ selected: 'src', expanded: ['root', 'src'] });
  const crop = ui.state({ preview: '' as string });
  const cal = ui.state({ selected: '2026-08-30' });

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(undefined, 'Text, structured content, images, embeds, and calendars.');

      exampleSection('Markdown', 'Client parses with marked and sanitizes with DOMPurify.');
      ui.markdown(`# Hello from the server

This is **bold**, this is *italic*, and here is a [link](https://example.com).

- Timer handle: \`.activate()\` / \`.deactivate()\` / \`.cancel()\`
- Interval is in **seconds**

\`\`\`ts
ui.timer(1, () => label.setText(new Date().toISOString()));
\`\`\`
`);
      ui.separator();

      exampleSection('HTML', 'Trusted server HTML (XSS risk — only pass content you control).');
      ui.html(
        '<p class="text-sm">Trusted <strong style="color:var(--primary)">HTML</strong> from the server.</p>',
      );
      ui.separator();

      exampleSection('Code block', 'ui.codeBlock — Shiki highlight + optional copy.');
      ui.codeBlock({
        language: 'typescript',
        code: `import { ui } from '@close-by/clay';

ui.page('/hello', () => {
  ui.label('Hello').classes('text-lg font-semibold');
  ui.button('Ping', { onClick: () => ui.notify('pong') });
});`,
      });
      ui.separator();

      exampleSection('Description list', 'ui.descriptionList — master-detail key/value rows.');
      ui.descriptionList({
        horizontal: true,
        items: [
          { term: 'Order', detail: 'ORD-1042' },
          { term: 'Status', detail: 'Processing' },
          { term: 'Owner', detail: 'ops@example.com' },
          { term: 'Region', detail: 'eu-west-1' },
        ],
      });
      ui.separator();

      exampleSection('Static table', 'ui.staticTable — small read-only datasets (bordered + hover by default).');
      ui.staticTable({
        caption: 'Recent queries',
        striped: true,
        density: 'compact',
        columns: [
          { key: 'query', label: 'Query', mono: true },
          { key: 'ms', label: 'ms', align: 'right' },
          { key: 'rows', label: 'Rows', align: 'right' },
        ],
        rows: [
          { query: 'SELECT count(*) FROM orders', ms: 12, rows: 1 },
          { query: 'SELECT * FROM units WHERE ok = false', ms: 48, rows: 3 },
          { query: 'SHOW TABLES', ms: 4, rows: 18 },
        ],
      });
      ui.spacer({ orientation: 'vertical', size: 'sm' });
      ui.staticTable({
        columns: [{ key: 'id', label: 'Id' }],
        rows: [],
        emptyTitle: 'No queries yet',
      });
      ui.separator();

      exampleSection('Item list', 'ui.itemList — settings / notification rows.');
      ui.itemList({
        items: [
          {
            id: 'deploy',
            title: 'Deploy finished',
            description: 'main · 2m ago',
            icon: 'circle-check',
            badge: 'ok',
          },
          {
            id: 'lag',
            title: 'Queue lag elevated',
            description: 'worker · 5m ago',
            icon: 'triangle-alert',
            badge: 'warn',
          },
          {
            id: 'docs',
            title: 'View runbook',
            description: 'External link example',
            icon: 'book-open',
            href: '#',
          },
        ],
      });
      ui.separator();

      exampleSection('Tree', 'ui.tree — nested nodes with select + expand.');
      const treePanel = ui.refreshable(() => {
        ui.tree({
          selected: treeState.selected,
          expanded: treeState.expanded,
          nodes: [
            {
              id: 'root',
              label: 'project',
              children: [
                {
                  id: 'src',
                  label: 'src',
                  children: [
                    { id: 'main', label: 'main.ts' },
                    { id: 'chrome', label: 'chrome.ts' },
                  ],
                },
                {
                  id: 'docs',
                  label: 'docs',
                  children: [
                    { id: 'api', label: 'api.md' },
                    { id: 'elements', label: 'elements.md' },
                  ],
                },
              ],
            },
          ],
          onSelect: (id) => {
            treeState.selected = id;
            ui.notify(`Selected: ${id}`, 'info');
            treePanel.refresh();
          },
          onExpand: (expanded) => {
            treeState.expanded = expanded;
            treePanel.refresh();
          },
        });
        ui.label(`Selected: ${treeState.selected || '—'}`).classes(
          'text-sm text-muted-foreground',
        );
      });
      ui.separator();

      exampleSection(
        'Related forms',
        'ui.rating, ui.colorPicker, and ui.tags with bindValue + draft.',
      );
      ui.button('Open Forms', {
        variant: 'outline',
        onClick: () => ui.navigate('/examples/forms'),
      });
      ui.button('Open File Upload (dropzone)', {
        variant: 'outline',
        onClick: () => ui.navigate('/examples/upload'),
      });
      ui.separator();

      exampleSection('Image', 'Plain img with src URL.');
      ui.image('https://picsum.photos/seed/clay/640/240', {
        alt: 'Sample photo',
        className: 'rounded-md border',
      });
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
        'Iframe',
        'ui.iframe — first-class embed (prefer over ui.html with an iframe tag).',
      );
      ui.iframe('https://example.com', {
        title: 'Example embed',
        height: 220,
        className: 'max-w-xl border rounded-md',
        loading: 'lazy',
      });
      ui.separator();

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

      exampleSection(
        'Event calendar',
        'ui.eventCalendar — month grid (dots on event days) + day list on the right.',
      );
      ui.auto(() => {
        ui.eventCalendar({
          selected: cal.selected,
          events: CALENDAR_EVENTS,
          onSelect: (date) => {
            cal.selected = date;
          },
          onEventClick: (id) => ui.notify(`Event ${id}`, 'info'),
        });
      });
    }, { gap: 6 });
  });
});
