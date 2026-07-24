import { reactive } from '@badui/core';
import { ui } from '@badui/ui';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

ui.page('/examples/todo', () => {
  ui.app({ ...APP_SHELL }, () => {
  let todos: Todo[] = [];
  let todoFilter: 'all' | 'active' | 'completed' = 'all';
  const draft = reactive({ text: '' });

  ui.container(() => {
    ui.column(() => {
      ui.label('Todo List').classes('text-3xl font-bold');

      const input = ui.input({ placeholder: 'What needs to be done?' });
      input.bindValue(draft, 'text');

      let listUi: ReturnType<typeof ui.refreshable>;

      ui.row(() => {
        ui.button('Add', {
          onClick: () => {
            const text = draft.text.trim();
            if (!text) return;
            todos = [...todos, { id: Date.now().toString(), text, completed: false }];
            draft.text = '';
            listUi.refresh();
          },
        });
      });

      listUi = ui.refreshable(() => {
        const filtered = todos.filter((todo) => {
          if (todoFilter === 'active') return !todo.completed;
          if (todoFilter === 'completed') return todo.completed;
          return true;
        });
        const completedCount = todos.filter((t) => t.completed).length;

        ui.row(() => {
          ui.button('All', {
            variant: todoFilter === 'all' ? 'default' : 'ghost',
            size: 'sm',
            onClick: () => {
              todoFilter = 'all';
              listUi.refresh();
            },
          });
          ui.button(`Active (${todos.filter((t) => !t.completed).length})`, {
            variant: todoFilter === 'active' ? 'default' : 'ghost',
            size: 'sm',
            onClick: () => {
              todoFilter = 'active';
              listUi.refresh();
            },
          });
          ui.button(`Completed (${completedCount})`, {
            variant: todoFilter === 'completed' ? 'default' : 'ghost',
            size: 'sm',
            onClick: () => {
              todoFilter = 'completed';
              listUi.refresh();
            },
          });
        }, { gap: 2 });

        if (filtered.length === 0) {
          ui.label('No todos yet!').classes('text-muted-foreground');
        } else {
          for (const todo of filtered) {
            ui.card(() => {
              ui.row(() => {
                ui.checkbox({
                  checked: todo.completed,
                  label: todo.text,
                  onChange: (checked) => {
                    todos = todos.map((t) =>
                      t.id === todo.id ? { ...t, completed: Boolean(checked) } : t,
                    );
                    listUi.refresh();
                  },
                }).classes(todo.completed ? 'line-through opacity-50' : '');
                ui.button('×', {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: () => {
                    todos = todos.filter((t) => t.id !== todo.id);
                    listUi.refresh();
                  },
                });
              }, { gap: 2 });
            });
          }
        }

        ui.label(`${completedCount} of ${todos.length} completed`).classes('text-sm text-muted-foreground');
      });
    }, { gap: 3 });
  }, { centered: true, width: 'lg' });
  });
});
import { APP_SHELL } from '../nav';

