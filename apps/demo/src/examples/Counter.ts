import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';
import { APP_SHELL } from '../nav';

ui.page('/examples/counter', () => {
  ui.app({ ...APP_SHELL }, () => {
    let count = 0;
    let history: number[] = [];

    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(undefined, 'Element refs, setText, and refreshable history.');

        ui.card(
          { title: 'Preview', description: 'Click to update the count over WebSocket.', gap: 6 },
          () => {
            const countLabel = ui
              .label(String(count))
              .classes('text-4xl font-semibold tabular-nums tracking-tight');

            const historyUi = ui.refreshable(() => {
              ui.label(history.length ? history.join(' → ') : 'No history yet').classes(
                'text-sm text-muted-foreground',
              );
            });

            ui.row(() => {
              ui.button('Decrement', {
                variant: 'outline',
                onClick: () => {
                  count--;
                  history = [...history, count];
                  countLabel.setText(String(count));
                  historyUi.refresh();
                },
              });
              ui.button('Reset', {
                variant: 'ghost',
                onClick: () => {
                  count = 0;
                  history = [];
                  countLabel.setText(String(count));
                  historyUi.refresh();
                },
              });
              ui.button('Increment', {
                onClick: () => {
                  count++;
                  history = [...history, count];
                  countLabel.setText(String(count));
                  historyUi.refresh();
                },
              });
            }, { gap: 2 });
          },
        );
      }, { gap: 6 });
    });
  });
});
