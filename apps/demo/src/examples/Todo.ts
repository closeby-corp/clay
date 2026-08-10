import { ui, reactive } from '@clay/ui';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Todo',
  icon: 'list-todo',
  order: 20,
};

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

ui.page('/examples/todo', () => {
    let todos: Todo[] = [];
    let todoFilter: 'all' | 'active' | 'completed' = 'all';
    const draft = reactive({ text: '' });

    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(undefined, 'bindValue on the draft input, refreshable filtered list.');

        ui.card({ title: 'Tasks', description: 'Add items, filter, and toggle completion.', gap: 4 }, () => {
        let listUi: ReturnType<typeof ui.refreshable>;

        ui.row(() => {
          const input = ui.input({ placeholder: 'What needs to be done?' }).classes('flex-1');
          input.bindValue(draft, 'text');
          ui.button('Add', {
            onClick: () => {
              const text = draft.text.trim();
              if (!text) return;
              todos = [...todos, { id: Date.now().toString(), text, completed: false }];
              draft.text = '';
              listUi.refresh();
            },
          });
        }, { gap: 2 });

        listUi = ui.refreshable(() => {
          const filtered = todos.filter((todo) => {
            if (todoFilter === 'active') return !todo.completed;
            if (todoFilter === 'completed') return todo.completed;
            return true;
          });
          const completedCount = todos.filter((t) => t.completed).length;
          const activeCount = todos.filter((t) => !t.completed).length;

          ui.row(() => {
            ui.button('All', {
              variant: todoFilter === 'all' ? 'secondary' : 'ghost',
              size: 'sm',
              onClick: () => {
                todoFilter = 'all';
                listUi.refresh();
              },
            });
            ui.button(`Active (${activeCount})`, {
              variant: todoFilter === 'active' ? 'secondary' : 'ghost',
              size: 'sm',
              onClick: () => {
                todoFilter = 'active';
                listUi.refresh();
              },
            });
            ui.button(`Completed (${completedCount})`, {
              variant: todoFilter === 'completed' ? 'secondary' : 'ghost',
              size: 'sm',
              onClick: () => {
                todoFilter = 'completed';
                listUi.refresh();
              },
            });
          }, { gap: 1 });

          if (filtered.length === 0) {
            ui.label('No tasks yet.').classes('py-6 text-center text-sm text-muted-foreground');
          } else {
            ui.column(() => {
              for (const todo of filtered) {
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
                  }).classes(todo.completed ? 'flex-1 line-through opacity-60' : 'flex-1');
                  ui.button('Delete', {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => {
                      todos = todos.filter((t) => t.id !== todo.id);
                      listUi.refresh();
                    },
                  });
                }, { gap: 2 }).classes('items-center rounded-md border px-3 py-2');
              }
            }, { gap: 2 });
          }

          ui.label(`${completedCount} of ${todos.length} completed`).classes('text-xs text-muted-foreground');
        });
      });
      }, { gap: 6 });
    });
});
