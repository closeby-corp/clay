import { ui } from '@badui/ui';

ui.page('/examples/counter', () => {
  let count = 0;
  let history: number[] = [];

  ui.label('Counter Example').classes('text-3xl font-bold');
  ui.label(`Count: ${count}`).classes('text-2xl');

  if (history.length > 0) {
    ui.label(`History: ${history.join(' → ')}`).classes('text-sm opacity-70');
  }

  ui.row(() => {
    ui.button('-', {
      color: 'error',
      size: 'lg',
      on_click: () => {
        count = count - 1;
        history.push(count);
      },
    });
    ui.button('Reset', {
      variant: 'ghost',
      size: 'lg',
      on_click: () => {
        count = 0;
        history = [];
      },
    });
    ui.button('+', {
      color: 'success',
      size: 'lg',
      on_click: () => {
        count = count + 1;
        history.push(count);
      },
    });
  });
});
