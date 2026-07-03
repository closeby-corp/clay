import { ui, getCurrentContainer } from '@badui/ui';
import { button, label, input, checkbox, row, card } from '@badui/components';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

ui.page('/examples/todo', () => {
  let todos: Todo[] = [];
  let todoFilter: 'all' | 'active' | 'completed' = 'all';

  const newTodoText = input('newTodo', {
    placeholder: 'What needs to be done?',
  });

  const filteredTodos = todos.filter((todo) => {
    if (todoFilter === 'active') return !todo.completed;
    if (todoFilter === 'completed') return todo.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;

  ui.container(() => {
    ui.column(() => {
      ui.label('Todo List').classes('text-3xl font-bold');

      ui.row(() => {
        getCurrentContainer().add(newTodoText);
        ui.button('Add', {
          color: 'primary',
          on_click: () => {
            const text = newTodoText.get().trim();
            if (text) {
              todos.push({
                id: Date.now().toString(),
                text,
                completed: false,
              });
              newTodoText.set('');
            }
          },
        });
      });

      ui.row(() => {
        ui.button('All', {
          variant: todoFilter === 'all' ? 'default' : 'ghost',
          size: 'sm',
          on_click: () => { todoFilter = 'all'; },
        });
        ui.button(`Active (${todos.filter((t) => !t.completed).length})`, {
          variant: todoFilter === 'active' ? 'default' : 'ghost',
          size: 'sm',
          on_click: () => { todoFilter = 'active'; },
        });
        ui.button(`Completed (${completedCount})`, {
          variant: todoFilter === 'completed' ? 'default' : 'ghost',
          size: 'sm',
          on_click: () => { todoFilter = 'completed'; },
        });
      });

      if (filteredTodos.length === 0) {
        ui.label('No todos yet!').classes('text-neutral opacity-70');
      } else {
        for (const todo of filteredTodos) {
          getCurrentContainer().add(card({ bordered: true }, (cardCol) => {
            const checked = checkbox(`todo-${todo.id}`, { checked: todo.completed });
            checked.onChange((isChecked) => {
              todos = todos.map((t) =>
                t.id === todo.id ? { ...t, completed: isChecked } : t,
              );
            });
            cardCol.add(row(
              checked,
              label(todo.text).classes(todo.completed ? 'line-through opacity-50' : ''),
              button('×', {
                color: 'error',
                size: 'sm',
                variant: 'ghost',
                on_click: () => {
                  todos = todos.filter((t) => t.id !== todo.id);
                },
              }),
            ));
          }));
        }
      }

      ui.label(`${completedCount} of ${todos.length} completed`).classes('text-sm text-neutral');
    });
  }, { centered: true, width: 'lg' });
});
