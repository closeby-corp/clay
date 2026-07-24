import { ui } from '@badui/ui';
import { APP_SHELL } from '../nav';

ui.page('/examples/upload', () => {
  ui.app({ ...APP_SHELL }, () => {
  let files: string[] = [];

  ui.container(() => {
    ui.column(() => {
      ui.label('File Upload').classes('text-3xl font-bold');
      ui.label('Demo upload — clicks add mock files to the list.').classes('text-muted-foreground');

      let listUi: ReturnType<typeof ui.refreshable>;

      ui.button('Upload file', {
        onClick: () => {
          files = [...files, `file-${Date.now()}.pdf`];
          listUi.refresh();
        },
      });

      listUi = ui.refreshable(() => {
        if (files.length === 0) {
          ui.label('No files uploaded yet.').classes('text-sm text-muted-foreground');
          return;
        }
        ui.label('Uploaded Files:').classes('font-semibold');
        for (const file of files) {
          ui.row(() => {
            ui.label(file);
            ui.button('Delete', {
              variant: 'destructive',
              size: 'sm',
              onClick: () => {
                files = files.filter((f) => f !== file);
                listUi.refresh();
              },
            });
          }, { gap: 2 });
        }
      });
    }, { gap: 3 });
  }, { centered: true, width: 'md' });
  });
});
