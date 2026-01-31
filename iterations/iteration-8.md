# Iteration 8: Advanced Components

## Goals
- Implement DataTable component with sorting/pagination
- Create Toast notification system
- Add Dark Mode toggle with DaisyUI themes
- Build Progress/Loading indicators

## Components

### DataTable
```typescript
// packages/components/src/advanced/DataTable.ts
export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  sortable?: boolean;
  paginate?: boolean;
  pageSize?: number;
  currentPage?: number;
  selectable?: boolean;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

export class DataTable<T> extends Component {
  private sortKey: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private currentPage: number;
  
  constructor(props: DataTableProps<T>) {
    super(props);
    this.currentPage = props.currentPage || 1;
  }
  
  render(): string {
    const { data, columns, pageSize = 10 } = this.props;
    
    // Pagination
    const totalPages = Math.ceil(data.length / pageSize);
    const start = (this.currentPage - 1) * pageSize;
    const paginatedData = this.props.paginate 
      ? data.slice(start, start + pageSize)
      : data;
    
    const tableClass = [
      'table',
      this.props.striped ? 'table-zebra' : '',
      this.props.hover ? 'table-hover' : '',
      this.props.compact ? 'table-compact' : '',
      'w-full'
    ].filter(Boolean).join(' ');
    
    return `
      <div id="${this.id}" class="overflow-x-auto">
        <table class="${tableClass}">
          <thead>
            <tr>
              ${this.props.selectable ? '<th><input type="checkbox" class="checkbox" /></th>' : ''}
              ${columns.map(col => `
                <th 
                  class="${col.align ? `text-${col.align}` : ''} ${col.sortable ? 'cursor-pointer' : ''}"
                  ${col.sortable ? `onclick="sortTable('${col.key}')"` : ''}
                >
                  ${col.header}
                  ${col.sortable && this.sortKey === col.key 
                    ? `<span class="ml-1">${this.sortDirection === 'asc' ? '↑' : '↓'}</span>` 
                    : ''}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${paginatedData.map(row => `
              <tr ${this.props.onRowClick ? `class="cursor-pointer" onclick="${this.generateRowClickHandler(row)}"` : ''}>
                ${this.props.selectable ? `<td><input type="checkbox" class="checkbox" /></td>` : ''}
                ${columns.map(col => {
                  const value = col.render 
                    ? col.render(row)
                    : (row as any)[col.key];
                  return `<td class="${col.align ? `text-${col.align}` : ''}">${value}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${this.props.paginate && totalPages > 1 ? this.renderPagination(totalPages) : ''}
      </div>
    `;
  }
  
  private renderPagination(totalPages: number): string {
    return `
      <div class="flex justify-center mt-4">
        <div class="join">
          <button 
            class="join-item btn btn-sm ${this.currentPage === 1 ? 'btn-disabled' : ''}"
            ${this.currentPage > 1 ? `onclick="goToPage(${this.currentPage - 1})"` : ''}
          >
            «
          </button>
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
            <button 
              class="join-item btn btn-sm ${page === this.currentPage ? 'btn-active' : ''}"
              onclick="goToPage(${page})"
            >
              ${page}
            </button>
          `).join('')}
          <button 
            class="join-item btn btn-sm ${this.currentPage === totalPages ? 'btn-disabled' : ''}"
            ${this.currentPage < totalPages ? `onclick="goToPage(${this.currentPage + 1})"` : ''}
          >
            »
          </button>
        </div>
      </div>
    `;
  }
}

// Usage:
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' }
];

dataTable(users, {
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { 
      key: 'role', 
      header: 'Role',
      render: (user) => `<span class="badge badge-primary">${user.role}</span>`
    }
  ],
  keyField: 'id',
  sortable: true,
  paginate: true,
  pageSize: 10,
  hover: true,
  onRowClick: (user) => console.log('Clicked:', user)
});
```

### Toast Notifications
```typescript
// packages/components/src/advanced/Toast.ts
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;  // milliseconds
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
}

export class Toast extends Component {
  render(): string {
    const positionClass = this.props.position || 'bottom-right';
    const alertClass = `alert alert-${this.props.type || 'info'}`;
    
    return `
      <div id="${this.id}" 
           class="toast toast-${positionClass} z-50"
           _="init wait ${this.props.duration || 5000}ms then remove me">
        <div class="${alertClass}">
          ${this.getIcon()}
          <span>${this.props.message}</span>
          ${this.props.dismissible !== false ? `
            <button class="btn btn-ghost btn-sm" onclick="this.parentElement.parentElement.remove()">✕</button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  private getIcon(): string {
    switch (this.props.type) {
      case 'success': return '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      case 'warning': return '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
      case 'error': return '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
      default: return '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    }
  }
}

// Toast Service
export class ToastService {
  private client: Client;
  
  constructor(client: Client) {
    this.client = client;
  }
  
  show(message: string, type: ToastType = 'info', options?: Partial<ToastProps>): void {
    const toast = new Toast({ message, type, ...options });
    this.client.injectHTML(toast.render());
  }
  
  success(message: string, options?: Partial<ToastProps>): void {
    this.show(message, 'success', options);
  }
  
  error(message: string, options?: Partial<ToastProps>): void {
    this.show(message, 'error', options);
  }
  
  warning(message: string, options?: Partial<ToastProps>): void {
    this.show(message, 'warning', options);
  }
  
  info(message: string, options?: Partial<ToastProps>): void {
    this.show(message, 'info', options);
  }
}

// Usage:
button('Save').onClick(async (client) => {
  const toast = new ToastService(client);
  
  try {
    await saveData();
    toast.success('Saved successfully!');
  } catch (err) {
    toast.error('Failed to save');
  }
});
```

### Dark Mode Toggle
```typescript
// packages/components/src/advanced/DarkMode.ts
export class DarkModeToggle extends Component {
  render(): string {
    return `
      <label id="${this.id}" class="swap swap-rotate">
        <input type="checkbox" 
               ${this.isDarkMode() ? 'checked' : ''}
               onchange="toggleTheme(this.checked)" />
        
        <!-- Sun icon -->
        <svg class="swap-on fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41Z"/>
        </svg>
        
        <!-- Moon icon -->
        <svg class="swap-off fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
      </label>
      
      <script>
        function toggleTheme(isDark) {
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }
        
        // Initialize theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          document.documentElement.setAttribute('data-theme', savedTheme);
        }
      </script>
    `;
  }
  
  private isDarkMode(): boolean {
    // Check server-side preference or default
    return false;
  }
}

// Theme Configuration
export const themes = {
  light: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    neutral: '#374151',
    'base-100': '#ffffff',
    'base-200': '#f3f4f6',
    'base-300': '#e5e7eb'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    accent: '#fbbf24',
    neutral: '#1f2937',
    'base-100': '#1f2937',
    'base-200': '#111827',
    'base-300': '#374151'
  }
};
```

### Progress/Loading
```typescript
// packages/components/src/advanced/Progress.ts
export interface ProgressProps {
  value: number;  // 0-100
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  indeterminate?: boolean;
  showValue?: boolean;
}

export class Progress extends Component {
  render(): string {
    const percentage = this.props.indeterminate 
      ? 0 
      : Math.min(100, (this.props.value / (this.props.max || 100)) * 100);
    
    const classes = [
      'progress',
      this.props.size ? `progress-${this.props.size}` : '',
      this.props.color ? `progress-${this.props.color}` : 'progress-primary',
      this.props.indeterminate ? 'progress-indeterminate' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <div id="${this.id}" class="w-full">
        ${this.props.showValue ? `
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium">Progress</span>
            <span class="text-sm font-medium">${Math.round(percentage)}%</span>
          </div>
        ` : ''}
        <progress 
          class="${classes} w-full"
          value="${this.props.indeterminate ? '' : percentage}"
          max="100"
        ></progress>
      </div>
    `;
  }
}

// Loading Spinner
export interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral';
  text?: string;
}

export class Loading extends Component {
  render(): string {
    const spinnerClass = [
      'loading',
      'loading-spinner',
      this.props.size ? `loading-${this.props.size}` : 'loading-md',
      this.props.color ? `text-${this.props.color}` : ''
    ].filter(Boolean).join(' ');
    
    return `
      <div id="${this.id}" class="flex items-center gap-2">
        <span class="${spinnerClass}"></span>
        ${this.props.text ? `<span>${this.props.text}</span>` : ''}
      </div>
    `;
  }
}

// Usage:
progress(75, { color: 'success', showValue: true });
loading({ size: 'lg', text: 'Loading data...' });
```

## Convenience Functions
```typescript
export function dataTable<T>(data: T[], props: Omit<DataTableProps<T>, 'data'>): DataTable<T> {
  return new DataTable({ data, ...props });
}

export function toast(message: string, type?: ToastType, props?: Partial<ToastProps>): Toast {
  return new Toast({ message, type, ...props });
}

export function darkModeToggle(): DarkModeToggle {
  return new DarkModeToggle({});
}

export function progress(value: number, props?: Omit<ProgressProps, 'value'>): Progress {
  return new Progress({ value, ...props });
}

export function loading(props?: LoadingProps): Loading {
  return new Loading(props || {});
}
```

## Acceptance Criteria
- [ ] DataTable with sorting, pagination, row selection
- [ ] Toast notifications with auto-dismiss
- [ ] Dark mode toggle with DaisyUI themes
- [ ] Progress bar and loading spinner
- [ ] All components styled with DaisyUI
- [ ] HTMX + WebSocket integration

## Next Steps
Iteration 9: Example applications (Counter, Todo, Chat)
