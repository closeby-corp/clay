import { ui } from '@badui/ui';

ui.page('/todo-stats', () => {
  let todos: { completed: boolean }[] = [];
  const completedCount = todos.filter((t) => t.completed).length;
  ui.label(`Count: ${todos.length}`);
  ui.label(`${completedCount} of ${todos.length} done`);
  ui.button(`Active (${todos.filter((t) => !t.completed).length})`);
});
