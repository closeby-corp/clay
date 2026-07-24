import { ui } from '@badui/ui';

ui.page('/examples/counter', () => {
  let count = 0;
  let history: number[] = [];

  ui.column(() => {
    ui.label('Counter Example').classes('text-3xl font-bold');
    const countLabel = ui.label(`Count: ${count}`).classes('text-2xl');

    const historyUi = ui.refreshable(() => {
      if (history.length > 0) {
        ui.label(`History: ${history.join(' → ')}`).classes('text-sm text-muted-foreground');
      }
    });

    ui.row(() => {
      ui.button('-', {
        variant: 'destructive',
        size: 'lg',
        onClick: () => {
          count--;
          history = [...history, count];
          countLabel.setText(`Count: ${count}`);
          historyUi.refresh();
        },
      });
      ui.button('Reset', {
        variant: 'ghost',
        size: 'lg',
        onClick: () => {
          count = 0;
          history = [];
          countLabel.setText(`Count: ${count}`);
          historyUi.refresh();
        },
      });
      ui.button('+', {
        size: 'lg',
        onClick: () => {
          count++;
          history = [...history, count];
          countLabel.setText(`Count: ${count}`);
          historyUi.refresh();
        },
      });
    }, { gap: 2 });
  }, { gap: 3 });
});
