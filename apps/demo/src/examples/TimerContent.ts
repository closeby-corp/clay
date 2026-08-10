import { ui } from '@clay/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Timer & content',
  icon: 'clock',
  order: 85,
};

ui.page('/examples/timer-content', () => {
  let ticks = 0;

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'ui.timer for live updates; markdown / html / image for content.',
      );

      exampleSection('Live clock', 'Repeating timer updates a label every second.');
      ui.card({ title: 'Server time', description: 'Session-scoped setInterval.', gap: 4 }, () => {
        const clockLabel = ui
          .label(new Date().toLocaleTimeString())
          .classes('text-3xl font-semibold tabular-nums tracking-tight');
        const tickLabel = ui.label('Ticks: 0').classes('text-sm text-muted-foreground');

        const clock = ui.timer(1, () => {
          ticks++;
          clockLabel.setText(new Date().toLocaleTimeString());
          tickLabel.setText(`Ticks: ${ticks}`);
        });

        ui.row(() => {
          ui.button('Pause', {
            variant: 'outline',
            size: 'sm',
            onClick: () => clock.deactivate(),
          });
          ui.button('Resume', {
            variant: 'outline',
            size: 'sm',
            onClick: () => clock.activate(),
          });
          ui.button('Cancel', {
            variant: 'destructive',
            size: 'sm',
            onClick: () => {
              clock.cancel();
              ui.notify('Timer cancelled', 'warning');
              console.log('Timer cancelled');
            },
          });
        }, { gap: 2 });
      });

      exampleSection('Markdown', 'Client parses with marked and sanitizes with DOMPurify.');
      ui.markdown(`# Hello from the server

This is **bold**, this is *italic*, and here is a [link](https://example.com).

- Timer handle: \`.activate()\` / \`.deactivate()\` / \`.cancel()\`
- Interval is in **seconds**

\`\`\`ts
ui.timer(1, () => label.setText(new Date().toISOString()));
\`\`\`
`);

      exampleSection('HTML', 'Trusted server HTML (XSS risk — only pass content you control).');
      ui.html(
        '<p class="text-sm">Trusted <strong style="color:var(--primary)">HTML</strong> from the server.</p>',
      );

      exampleSection('Image', 'Plain img with src URL.');
      ui.image('https://picsum.photos/seed/clay/640/240', {
        alt: 'Sample photo',
        className: 'rounded-md border',
      });
    }, { gap: 6 });
  });
});
