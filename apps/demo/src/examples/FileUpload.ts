import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';
import { APP_SHELL } from '../nav';

ui.page('/examples/upload', () => {
  ui.app({ ...APP_SHELL }, () => {
    let files: string[] = [];

    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(undefined, 'Demo upload — clicks add mock files to the list.');

        ui.card({ title: 'Uploads', description: 'No real storage; files are session-local.', gap: 4 }, () => {
          let listUi: ReturnType<typeof ui.refreshable>;

          ui.button('Upload file', {
            variant: 'outline',
            onClick: () => {
              files = [...files, `file-${Date.now()}.pdf`];
              listUi.refresh();
            },
          });

          listUi = ui.refreshable(() => {
            if (files.length === 0) {
              ui.label('No files uploaded yet.').classes('py-6 text-center text-sm text-muted-foreground');
              return;
            }
            ui.column(() => {
              for (const file of files) {
                ui.row(() => {
                  ui.label(file).classes('flex-1 truncate text-sm');
                  ui.button('Delete', {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => {
                      files = files.filter((f) => f !== file);
                      listUi.refresh();
                    },
                  });
                }, { gap: 2 }).classes('items-center rounded-md border px-3 py-2');
              }
            }, { gap: 2 });
          });
        });
      }, { gap: 6 });
    });
  });
});
