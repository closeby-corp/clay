import { ui } from '@badui/ui';
import type { UploadedFile } from '@badui/ui';
import { unlink } from 'node:fs/promises';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'File Upload',
  icon: 'upload',
  order: 40,
};

ui.page('/examples/upload', () => {
  const files = (ui.storage.tab.get<UploadedFile[]>('files') ?? []).slice();

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Real multipart upload via POST /upload; list kept in tab storage.',
      );

      ui.card(
        {
          title: 'Uploads',
          description: 'Files land on disk; metadata travels over the WebSocket.',
          gap: 4,
        },
        () => {
          let listUi: ReturnType<typeof ui.refreshable>;

          const persist = () => {
            ui.storage.tab.set('files', files.slice());
            listUi.refresh();
          };

          ui.upload({
            multiple: true,
            label: 'Choose files',
            onUpload: async (file) => {
              files.push(file);
              const count = ((await ui.storage.user.get<number>('uploadCount')) ?? 0) + 1;
              await ui.storage.user.set('uploadCount', count);
              ui.notify(`Uploaded ${file.name} (lifetime uploads: ${count})`, 'success');
              persist();
            },
          });

          listUi = ui.refreshable(() => {
            if (files.length === 0) {
              ui.label('No files uploaded yet.').classes(
                'py-6 text-center text-sm text-muted-foreground',
              );
              return;
            }
            ui.column(() => {
              for (const file of files) {
                ui.row(() => {
                  ui.column(() => {
                    ui.label(file.name).classes('truncate text-sm font-medium');
                    ui.label(`${file.size} bytes · ${file.type || 'unknown'}`).classes(
                      'truncate text-xs text-muted-foreground',
                    );
                  }, { gap: 0 }).classes('min-w-0 flex-1');
                  ui.button('Download', {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: async () => {
                      const text = await Bun.file(file.path).text();
                      ui.download(file.name, file.type || 'text/plain', text);
                    },
                  });
                  ui.button('Copy name', {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => {
                      ui.clipboard(file.name);
                      ui.notify(`Copied ${file.name}`, 'success');
                    },
                  });
                  ui.button('Delete', {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: async () => {
                      const idx = files.indexOf(file);
                      if (idx >= 0) files.splice(idx, 1);
                      try {
                        await unlink(file.path);
                      } catch {
                        // already gone
                      }
                      persist();
                    },
                  });
                }, { gap: 2 }).classes('items-center rounded-md border px-3 py-2');
              }
            }, { gap: 2 });
          });
        },
      );
    }, { gap: 6 });
  });
});
