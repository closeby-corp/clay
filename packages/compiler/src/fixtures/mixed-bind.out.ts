import { ui } from '@badui/ui';
ui.page('/todo-stats', ({ state }) => {
    state.defaults({
        todos: []
    });
    const completedCount = state.todos.filter((t) => t.completed).length;
    ui.label({ textExpr: "'Count: ' + $todos.length" });
    ui.label({ textExpr: "'' + $todos.filter(t => t.completed).length + ' of ' + $todos.length + ' done'" });
    ui.button({ textExpr: "'Active (' + $todos.filter(t => !t.completed).length + ')'" });
});
