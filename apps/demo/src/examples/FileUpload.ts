import { ui, getCurrentContainer } from '@badui/ui';
import { button, label, row, card } from '@badui/components';

ui.page('/examples/upload', () => {
  let files: string[] = [];

  ui.container(() => {
    ui.column(() => {
      ui.label('File Upload').classes('text-3xl font-bold');

      getCurrentContainer().add(card({ bordered: true }, (cardCol) => {
        cardCol.add({
          render: () => `
            <fieldset class="fieldset">
              <label class="label">Select file</label>
              <input type="file" name="file" class="file-input w-full" />
            </fieldset>
          `,
        });
        cardCol.add(button('Upload', {
          color: 'primary',
          on_click: () => {
            files.push(`file-${Date.now()}.pdf`);
          },
        }));
        if (files.length > 0) {
          cardCol.add(label('Uploaded Files:', { weight: 'bold' }));
          for (const file of files) {
            cardCol.add(row(
              label(file),
              button('Delete', {
                color: 'error',
                size: 'sm',
                on_click: () => {
                  files = files.filter((f) => f !== file);
                },
              }),
            ));
          }
        }
      }));
    });
  }, { centered: true, width: 'md' });
});
