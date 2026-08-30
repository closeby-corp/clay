import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'ReUI · batch 7',
  icon: 'layout-grid',
  order: 89,
  group: 'ReUI',
};

ui.page('/examples/reui-batch-7', () => {
  const search = ui.state({ value: 'clay', pinned: false });
  const perms = ui.state({ value: ['read', 'write'] as string[] });

  exampleFrame(() => {
    ui.column({ gap: 4 }, () => {
      exampleHeader(undefined, 'ReUI batch 7 — inputGroup, toggle, descriptionList, staticTable, aspectRatio, itemList, checkboxGroup.');

      ui.row({ gap: 2 }, () => {
        ui.link('ReUI batches 3–6', '/examples/reui-batches');
        ui.link('ReUI batch 1', '/examples/composed');
      });

      ui.separator();

      exampleSection('Input group', 'ui.inputGroup — prefix/suffix addons and inline action.');
      ui.auto(() => {
        ui.inputGroup({
          label: 'Site URL',
          prefix: 'https://',
          suffix: '.dev',
          value: search.value,
          placeholder: 'app',
          buttonLabel: 'Go',
          onInput: (v) => {
            search.value = v;
          },
          onButtonClick: () => ui.notify(`Open https://${search.value}.dev`, 'info'),
        });
      });

      ui.separator();

      exampleSection('Toggle', 'ui.toggle — pressed toolbar control (not switch / toggleGroup).');
      ui.auto(() => {
        ui.row({ gap: 2 }, () => {
          ui.toggle({
            icon: 'pin',
            text: 'Pin panel',
            pressed: search.pinned,
            variant: 'outline',
            onPressedChange: (p) => {
              search.pinned = p;
            },
          });
          ui.label(() => (search.pinned ? 'Pinned' : 'Unpinned')).classes('text-sm text-muted-foreground');
        });
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

      exampleSection('Aspect ratio', 'ui.aspectRatio — fixed-ratio media slot.');
      ui.aspectRatio({ ratio: 16 / 9, className: 'max-w-md' }, () => {
        ui.card({ className: 'flex h-full items-center justify-center border-0 shadow-none' }, () => {
          ui.label('16:9 tile').classes('text-muted-foreground');
        });
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

      exampleSection('Checkbox group', 'ui.checkboxGroup — multi-select permissions.');
      ui.auto(() => {
        ui.checkboxGroup({
          label: 'Permissions',
          orientation: 'horizontal',
          value: perms.value,
          options: [
            { value: 'read', label: 'Read' },
            { value: 'write', label: 'Write' },
            { value: 'admin', label: 'Admin' },
          ],
          onChange: (next) => {
            perms.value = next;
          },
        });
        ui.label(() => `Selected: ${perms.value.join(', ') || 'none'}`).classes(
          'text-sm text-muted-foreground',
        );
      });
    });
  });
});
