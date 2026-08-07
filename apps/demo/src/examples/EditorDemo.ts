import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Editor',
  icon: 'file-pen',
  order: 88,
};

const HTML_DEFAULT = '<p>Hello from <strong>HTML</strong> mode.</p>';
const MD_DEFAULT =
  '# Hello\n\nWrite **Markdown** — the wire value stays markdown.\n\n- one\n- two\n';

ui.page('/examples/editor', () => {
  const state = ui.state({
    html: HTML_DEFAULT,
    markdown: MD_DEFAULT,
  });
  const previews = {
    html: () => {},
    markdown: () => {},
  };

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.editor — Domternal rich text with format html | markdown, bindValue, debounced change.',
        );

        ui.row(
          () => {
            ui.column(
              () => {
                exampleSection('HTML', "format: 'html' (default) — value is an HTML string.");
                ui.editor({
                  format: 'html',
                  placeholder: 'Write HTML-backed rich text…',
                  onChange: () => previews.html(),
                }).bindValue(state, 'html');
                const htmlPanel = ui.refreshable(() => {
                  ui.label('Wire value (HTML)').classes(
                    'text-xs font-medium text-muted-foreground',
                  );
                  ui.codeBlock({
                    language: 'html',
                    code: state.html || ' ',
                    showCopy: true,
                  });
                });
                previews.html = () => htmlPanel.refresh();
              },
              { gap: 3 },
            ).classes('min-w-0 flex-1');

            ui.column(
              () => {
                exampleSection('Markdown', "format: 'markdown' — value is a Markdown string.");
                ui.editor({
                  format: 'markdown',
                  placeholder: 'Write Markdown…',
                  onChange: () => previews.markdown(),
                }).bindValue(state, 'markdown');
                const mdPanel = ui.refreshable(() => {
                  ui.label('Wire value (Markdown)').classes(
                    'text-xs font-medium text-muted-foreground',
                  );
                  ui.codeBlock({
                    language: 'markdown',
                    code: state.markdown || ' ',
                    showCopy: true,
                  });
                });
                previews.markdown = () => mdPanel.refresh();
              },
              { gap: 3 },
            ).classes('min-w-0 flex-1');
          },
          { gap: 6 },
        ).classes('flex-col lg:flex-row items-stretch');

        ui.separator();

        ui.button('Reset both', {
          variant: 'outline',
          onClick: () => {
            state.html = HTML_DEFAULT;
            state.markdown = MD_DEFAULT;
            previews.html();
            previews.markdown();
            ui.notify('Editors reset', 'info');
          },
        });
      },
      { gap: 6 },
    );
  });
});
