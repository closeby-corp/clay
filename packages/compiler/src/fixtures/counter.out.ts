import { ui } from '@badui/ui';
ui.page('/examples/counter', ({ state }) => {
    state.defaults({
        count: 0,
        history: []
    });
    ui.label('Counter Example').classes('text-3xl font-bold');
    ui.label(() => `Count: ${state.count}`).classes('text-2xl');
    if (state.history.length > 0) {
        ui.label(() => `History: ${state.history.join(' → ')}`).classes('text-sm opacity-70');
    }
    ui.row(() => {
        ui.button('-', {
            color: 'error',
            size: 'lg',
            on_click: () => {
                state.count = state.count - 1;
                state.history.push(state.count);
            },
        });
        ui.button('Reset', {
            variant: 'ghost',
            size: 'lg',
            on_click: () => {
                state.count = 0;
                state.history = [];
            },
        });
        ui.button('+', {
            color: 'success',
            size: 'lg',
            on_click: () => {
                state.count = state.count + 1;
                state.history.push(state.count);
            },
        });
    });
});
