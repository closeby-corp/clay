# Iteration 9: Example Applications

## Goals
- Build Counter example (basic reactive state)
- Create Todo list (forms, lists, state management)
- Implement Chat application (WebSocket, global state)
- Add File upload example
- Create Dashboard example

## Example 1: Counter

### Basic Counter
```typescript
// apps/demo/src/examples/Counter.ts
import { page, container, column, row, label, button, state } from 'bad-ui';

@page('/examples/counter')
export function counterExample() {
  const client = getCurrentClient();
  const count = client.createState('count', { initialValue: 0 });
  const history = client.createState('history', { initialValue: [] as number[] });
  
  container(() => {
    column(() => {
      label('Counter Example', { size: '3xl', weight: 'bold' });
      
      label(`Count: ${count.value}`, { size: '2xl' })
        .bind('count');
      
      row(() => {
        button('Decrement', { color: 'error', size: 'lg' })
          .onClick(() => {
            count.value--;
            history.value = [...history.value, count.value];
          });
        
        button('Reset', { variant: 'ghost', size: 'lg' })
          .onClick(() => {
            count.value = 0;
            history.value = [];
          });
        
        button('Increment', { color: 'success', size: 'lg' })
          .onClick(() => {
            count.value++;
            history.value = [...history.value, count.value];
          });
      });
      
      // Show history
      if (history.value.length > 0) {
        label('History:', { weight: 'semibold' });
        label(history.value.join(' → '));
      }
    });
  });
}
```

### Counter with Step Control
```typescript
@page('/examples/counter-advanced')
export function advancedCounter() {
  const client = getCurrentClient();
  const count = client.createState('count', { initialValue: 0 });
  const step = client.createState('step', { initialValue: 1 });
  
  container(() => {
    column(() => {
      label('Advanced Counter', { size: '3xl', weight: 'bold' });
      
      card(() => {
        column(() => {
          slider('step', {
            label: 'Step Size',
            min: 1,
            max: 10,
            value: step.value,
            showValue: true
          }).onChange((client, val) => step.value = val);
          
          label(`Current: ${count.value}`, { size: '4xl', weight: 'bold' })
            .bind('count');
          
          row(() => {
            button('-', { color: 'error', size: 'lg' })
              .onClick(() => count.value -= step.value);
            button('+', { color: 'success', size: 'lg' })
              .onClick(() => count.value += step.value);
          });
        });
      });
    });
  });
}
```

## Example 2: Todo List

### Full Todo Application
```typescript
// apps/demo/src/examples/Todo.ts
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

@page('/examples/todo')
export function todoExample() {
  const client = getCurrentClient();
  const todos = client.createState('todos', { initialValue: [] as Todo[] });
  const filter = client.createState('filter', { initialValue: 'all' as 'all' | 'active' | 'completed' });
  const newTodoText = client.createState('newTodo', { initialValue: '' });
  
  const filteredTodos = computed(client, [todos, filter], (todos, filter) => {
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  });
  
  container(() => {
    column(() => {
      label('Todo List', { size: '3xl', weight: 'bold' });
      
      // Add new todo
      row(() => {
        input('newTodo', {
          placeholder: 'What needs to be done?',
          value: newTodoText.value
        }).onInput((client, val) => newTodoText.value = val);
        
        button('Add', { color: 'primary' })
          .onClick(() => {
            if (newTodoText.value.trim()) {
              todos.value = [...todos.value, {
                id: Date.now().toString(),
                text: newTodoText.value,
                completed: false,
                createdAt: new Date()
              }];
              newTodoText.value = '';
            }
          });
      });
      
      // Filters
      row(() => {
        button('All', { 
          variant: filter.value === 'all' ? 'default' : 'ghost',
          size: 'sm'
        }).onClick(() => filter.value = 'all');
        
        button('Active', { 
          variant: filter.value === 'active' ? 'default' : 'ghost',
          size: 'sm'
        }).onClick(() => filter.value = 'active');
        
        button('Completed', { 
          variant: filter.value === 'completed' ? 'default' : 'ghost',
          size: 'sm'
        }).onClick(() => filter.value = 'completed');
      });
      
      // Todo list
      column(() => {
        if (filteredTodos.value.length === 0) {
          label('No todos yet!', { color: 'text-gray-500' });
        } else {
          filteredTodos.value.forEach(todo => {
            row(() => {
              checkbox(`todo-${todo.id}`, {
                checked: todo.completed,
                label: todo.text
              }).onChange((client, checked) => {
                todos.value = todos.value.map(t => 
                  t.id === todo.id ? { ...t, completed: checked } : t
                );
              });
              
              button('×', { 
                variant: 'ghost', 
                color: 'error',
                size: 'sm' 
              }).onClick(() => {
                todos.value = todos.value.filter(t => t.id !== todo.id);
              });
            });
          });
        }
      });
      
      // Stats
      const completedCount = todos.value.filter(t => t.completed).length;
      label(`${completedCount} of ${todos.value.length} completed`, {
        size: 'sm',
        color: 'text-gray-500'
      });
    });
  });
}
```

## Example 3: Chat Application

### Real-time Chat
```typescript
// apps/demo/src/examples/Chat.ts
interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

// Global state - shared across all clients
const chatMessages = GlobalState.create('chatMessages', [] as ChatMessage[]);
const onlineUsers = GlobalState.create('onlineUsers', new Set<string>());

@page('/examples/chat')
export function chatExample() {
  const client = getCurrentClient();
  const username = client.createState('username', { initialValue: 'Anonymous' });
  const messageText = client.createState('message', { initialValue: '' });
  
  // Register user as online
  onlineUsers.value = new Set([...onlineUsers.value, username.value]);
  
  container(() => {
    column(() => {
      row(() => {
        label('Chat Room', { size: '3xl', weight: 'bold' });
        label(`${onlineUsers.value.size} users online`, { size: 'sm' });
      });
      
      row(() => {
        // Chat messages area
        container(() => {
          chatMessages.value.forEach(msg => {
            const isMe = msg.user === username.value;
            row(() => {
              if (!isMe) {
                label(`${msg.user}:`, { weight: 'bold', color: 'primary' });
              }
              label(msg.text);
              label(msg.timestamp.toLocaleTimeString(), { 
                size: 'xs', 
                color: 'text-gray-400' 
              });
            });
          });
        }, { height: '400px', scrollable: true });
        
        // Online users list
        column(() => {
          label('Online', { weight: 'bold' });
          onlineUsers.value.forEach(user => {
            row(() => {
              label('●', { color: 'success' });
              label(user);
            });
          });
        });
      });
      
      // Message input
      row(() => {
        input('username', {
          value: username.value,
          label: 'Your name'
        }).onInput((client, val) => username.value = val);
        
        input('message', {
          placeholder: 'Type a message...',
          value: messageText.value
        }).onInput((client, val) => messageText.value = val);
        
        button('Send', { color: 'primary' })
          .onClick(() => {
            if (messageText.value.trim()) {
              chatMessages.value = [...chatMessages.value, {
                id: Date.now().toString(),
                user: username.value,
                text: messageText.value,
                timestamp: new Date()
              }];
              messageText.value = '';
            }
          });
      });
    });
  });
}
```

## Example 4: File Upload

### File Upload with Progress
```typescript
// apps/demo/src/examples/FileUpload.ts
@page('/examples/upload')
export function fileUploadExample() {
  const client = getCurrentClient();
  const uploadProgress = client.createState('progress', { initialValue: 0 });
  const uploadStatus = client.createState('status', { initialValue: 'idle' as 'idle' | 'uploading' | 'done' | 'error' });
  const files = client.createState('files', { initialValue: [] as string[] });
  
  container(() => {
    column(() => {
      label('File Upload', { size: '3xl', weight: 'bold' });
      
      card(() => {
        column(() => {
          // File input (HTMX handles the upload)
          form(() => {
            input('file', {
              type: 'file',
              label: 'Select file'
            });
            
            button('Upload', { 
              color: 'primary',
              loading: uploadStatus.value === 'uploading',
              disabled: uploadStatus.value === 'uploading'
            }).onClick(async () => {
              uploadStatus.value = 'uploading';
              
              // Simulate upload with progress
              for (let i = 0; i <= 100; i += 10) {
                await sleep(200);
                uploadProgress.value = i;
              }
              
              files.value = [...files.value, `file-${Date.now()}.txt`];
              uploadStatus.value = 'done';
              uploadProgress.value = 0;
              
              const toast = new ToastService(client);
              toast.success('File uploaded successfully!');
            });
          });
          
          // Progress bar
          if (uploadStatus.value === 'uploading') {
            progress(uploadProgress.value, { 
              color: 'primary',
              showValue: true 
            });
          }
          
          // Uploaded files list
          if (files.value.length > 0) {
            label('Uploaded Files:', { weight: 'bold' });
            files.value.forEach(file => {
              row(() => {
                label(file);
                button('Delete', { color: 'error', size: 'sm' })
                  .onClick(() => {
                    files.value = files.value.filter(f => f !== file);
                  });
              });
            });
          }
        });
      });
    });
  });
}
```

## Example 5: Dashboard

### Analytics Dashboard
```typescript
// apps/demo/src/examples/Dashboard.ts
@page('/examples/dashboard')
export function dashboardExample() {
  const client = getCurrentClient();
  const stats = client.createState('stats', {
    users: 1234,
    revenue: 5678.90,
    orders: 89,
    conversion: 3.45
  });
  
  container(() => {
    column(() => {
      label('Dashboard', { size: '3xl', weight: 'bold' });
      
      // Stats cards
      row(() => {
        statCard('Total Users', stats.value.users.toString(), '👥', 'primary');
        statCard('Revenue', `$${stats.value.revenue.toFixed(2)}`, '💰', 'success');
        statCard('Orders', stats.value.orders.toString(), '📦', 'info');
        statCard('Conversion', `${stats.value.conversion}%`, '📈', 'accent');
      });
      
      // Recent orders table
      dataTable([
        { id: 1, customer: 'John Doe', product: 'Widget A', amount: 29.99, status: 'completed' },
        { id: 2, customer: 'Jane Smith', product: 'Widget B', amount: 49.99, status: 'pending' },
        { id: 3, customer: 'Bob Johnson', product: 'Widget C', amount: 19.99, status: 'completed' }
      ], {
        columns: [
          { key: 'id', header: 'Order ID' },
          { key: 'customer', header: 'Customer', sortable: true },
          { key: 'product', header: 'Product' },
          { 
            key: 'amount', 
            header: 'Amount',
            render: row => `$${row.amount.toFixed(2)}`,
            align: 'right'
          },
          { 
            key: 'status', 
            header: 'Status',
            render: row => `<span class="badge badge-${row.status === 'completed' ? 'success' : 'warning'}">${row.status}</span>`
          }
        ],
        keyField: 'id',
        hover: true
      });
    });
  });
}

function statCard(title: string, value: string, icon: string, color: string) {
  return card(() => {
    row(() => {
      label(icon, { size: '3xl' });
      column(() => {
        label(title, { size: 'sm', color: 'text-gray-500' });
        label(value, { size: '2xl', weight: 'bold' });
      });
    });
  }, { 
    bgColor: `bg-${color}/10`,
    bordered: true,
    shadow: 'sm'
  });
}
```

## Demo Application Runner

### Main Entry Point
```typescript
// apps/demo/src/main.ts
import { Server } from '@bad-ui/server';

const server = new Server({
  port: 3000,
  title: 'Bad UI Demo',
  theme: 'light'
});

// Import all examples
import './examples/Counter';
import './examples/Todo';
import './examples/Chat';
import './examples/FileUpload';
import './examples/Dashboard';

server.start();
console.log('Demo server running at http://localhost:3000');
```

## Acceptance Criteria
- [ ] Counter with reactive state updates
- [ ] Todo list with CRUD operations
- [ ] Chat with real-time updates (WebSocket)
- [ ] File upload with progress indication
- [ ] Dashboard with stats and data table
- [ ] All examples demonstrate NiceGUI-style API
- [ ] Examples serve as documentation

## Completion
All 10 iterations complete! 🎉

## Next Steps
- Write comprehensive documentation
- Add more advanced components (Calendar, Tree, etc.)
- Create deployment guides
- Build a playground/REPL
- Add TypeScript strict mode option
- Performance optimizations
