import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Counter',
  icon: 'gauge',
  order: 12,
  group: 'Start here',
  groupIcon: 'sparkles',
};

ui.page('/examples/counter', () => {
    const state = ui.state({ count: 0, history: [] as number[] });

    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(undefined, 'Change the count and follow its history. State updates the display automatically.');

        ui.card(
          { title: 'Preview', description: 'Click to update the count over WebSocket.', gap: 6 },
          () => {
            ui.auto(() => {
              ui.label(String(state.count))
              .classes('text-4xl font-semibold tabular-nums tracking-tight');
            });

            ui.auto(() => {
              ui.label(state.history.length ? state.history.join(' → ') : 'No history yet').classes(
                'text-sm text-muted-foreground',
              );
            });

            ui.row(() => {
              ui.button('Decrement', {
                variant: 'outline',
                onClick: () => {
                  state.count--;
                  state.history = [...state.history, state.count];
                },
              });
              ui.button('Reset', {
                variant: 'ghost',
                onClick: () => {
                  state.count = 0;
                  state.history = [];
                },
              });
              ui.button('Increment', {
                onClick: () => {
                  state.count++;
                  state.history = [...state.history, state.count];
                },
              });
            }, { gap: 2 });
          },
        );
        exampleSection('Escape hatch: ui.refreshable', 'Rebuild a block explicitly when its data is outside reactive state.');
        let refreshes = 0;
        const manual = ui.refreshable(() => {
          ui.label(`Manual rebuilds: ${refreshes}`);
        });
        ui.button('Rebuild manually', { variant: 'outline', onClick: () => {
          refreshes++;
          manual.refresh();
        } });
      }, { gap: 6 });
    });
});
