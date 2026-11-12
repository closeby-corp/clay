import { ui } from '@close-by/clay';
import type { UploadedFile } from '@close-by/clay';
import { unlink } from 'node:fs/promises';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'File upload',
  icon: 'upload',
  order: 45,
  group: 'Forms & controls',
  groupIcon: 'sliders-horizontal',
};

ui.page('/examples/upload', () => {
  const state = ui.state({ files: (ui.storage.tab.get<UploadedFile[]>('files') ?? []).slice() });

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'POST /upload; file list in ui.storage.tab (survives reconnect), lifetime count in ui.storage.user.',
      );

      ui.card(
        {
          title: 'Uploads',
          description:
            'tab = this browser tab’s file list (sessionStorage; survives reload); user = cross-tab upload counter (async get/set).',
          gap: 4,
        },
        () => {

          const persist = () => {
            ui.storage.tab.set('files', state.files.slice());
          };

          ui.upload({
            multiple: true,
            label: 'Choose files',
            accept: 'image/*,.txt,.md,.pdf,.csv',
            maxSizeBytes: 5 * 1024 * 1024,
            onProgress: (p) => {
              // progress also shown on the widget; optional server hook
              void p;
            },
            onError: (message) => {
              ui.notify(message, 'error');
            },
            onAbort: () => {
              ui.notify('Upload cancelled', 'warning');
            },
            onUpload: async (file) => {
              state.files = [...state.files, file];
              const count = ((await ui.storage.user.get<number>('uploadCount')) ?? 0) + 1;
              await ui.storage.user.set('uploadCount', count);
              ui.notify(`Uploaded ${file.name} (lifetime uploads: ${count})`, 'success');
              persist();
            },
          });

          ui.separator();
          ui.label('Dropzone variant').classes('text-sm font-medium');
          ui.upload({
            variant: 'dropzone',
            multiple: true,
            label: 'Drop files here',
            accept: 'image/*,.txt,.md,.pdf,.csv',
            maxSizeBytes: 5 * 1024 * 1024,
            onError: (message) => {
              ui.notify(message, 'error');
            },
            onAbort: () => {
              ui.notify('Upload cancelled', 'warning');
            },
            onUpload: async (file) => {
              state.files = [...state.files, file];
              const count = ((await ui.storage.user.get<number>('uploadCount')) ?? 0) + 1;
              await ui.storage.user.set('uploadCount', count);
              ui.notify(`Uploaded ${file.name} (lifetime uploads: ${count})`, 'success');
              persist();
            },
          });

          ui.auto(() => {
            if (state.files.length === 0) {
              ui.label('No files uploaded yet.').classes(
                'py-6 text-center text-sm text-muted-foreground',
              );
              return;
            }
            ui.column(() => {
              for (const file of state.files) {
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
                      const idx = state.files.indexOf(file);
                      if (idx >= 0) state.files = state.files.filter((_, i) => i !== idx);
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
