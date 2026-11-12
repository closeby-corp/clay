import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Todo',
  icon: 'list-todo',
  order: 13,
  group: 'Start here',
  groupIcon: 'sparkles',
};

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

ui.page('/examples/todo', () => {
    const state = ui.state({ todos: [] as Todo[], todoFilter: 'all' as 'all' | 'active' | 'completed' });
    const draft = ui.state({ text: '' });

    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(undefined, 'Add tasks, mark them complete, and filter the list. Changes appear automatically.');

        ui.card({ title: 'Tasks', description: 'Add items, filter, and toggle completion.', gap: 4 }, () => {

        ui.row(() => {
          const input = ui.input({ placeholder: 'What needs to be done?' }).classes('flex-1');
          input.bindValue(draft, 'text');
          ui.button('Add', {
            onClick: () => {
              const text = draft.text.trim();
              if (!text) return;
              state.todos = [...state.todos, { id: Date.now().toString(), text, completed: false }];
              draft.text = '';
            },
          });
        }, { gap: 2 });

        ui.auto(() => {
          const filtered = state.todos.filter((todo) => {
            if (state.todoFilter === 'active') return !todo.completed;
            if (state.todoFilter === 'completed') return todo.completed;
            return true;
          });
          const completedCount = state.todos.filter((t) => t.completed).length;
          const activeCount = state.todos.filter((t) => !t.completed).length;

          ui.row(() => {
            ui.button('All', {
              variant: state.todoFilter === 'all' ? 'secondary' : 'ghost',
              size: 'sm',
              onClick: () => {
                state.todoFilter = 'all';
              },
            });
            ui.button(`Active (${activeCount})`, {
              variant: state.todoFilter === 'active' ? 'secondary' : 'ghost',
              size: 'sm',
              onClick: () => {
                state.todoFilter = 'active';
              },
            });
            ui.button(`Completed (${completedCount})`, {
              variant: state.todoFilter === 'completed' ? 'secondary' : 'ghost',
              size: 'sm',
              onClick: () => {
                state.todoFilter = 'completed';
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
                      state.todos = state.todos.map((t) =>
                        t.id === todo.id ? { ...t, completed: Boolean(checked) } : t,
                      );
                    },
                  }).classes(todo.completed ? 'flex-1 line-through opacity-60' : 'flex-1');
                  ui.button('Delete', {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => {
                      state.todos = state.todos.filter((t) => t.id !== todo.id);
                    },
                  });
                }, { gap: 2 }).classes('items-center rounded-md border px-3 py-2');
              }
            }, { gap: 2 });
          }

          ui.label(`${completedCount} of ${state.todos.length} completed`).classes('text-xs text-muted-foreground');
        });
      });
      }, { gap: 6 });
    });
});
