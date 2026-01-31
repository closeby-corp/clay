import { Component } from '@ralph/core';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  sortable?: boolean;
  paginate?: boolean;
  pageSize?: number;
  currentPage?: number;
  selectable?: boolean;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

export class DataTable<T extends Record<string, any>> extends Component<DataTableProps<T>> {
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
                <th class="${col.align ? `text-${col.align}` : ''} ${col.sortable ? 'cursor-pointer' : ''}">
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
              <tr class="${this.props.hover ? 'hover' : ''}">
                ${this.props.selectable ? `<td><input type="checkbox" class="checkbox" /></td>` : ''}
                ${columns.map(col => {
                  const value = col.render
                    ? col.render(row)
                    : row[col.key];
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
          <button class="join-item btn btn-sm ${this.currentPage === 1 ? 'btn-disabled' : ''}">
            «
          </button>
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
            <button class="join-item btn btn-sm ${page === this.currentPage ? 'btn-active' : ''}">
              ${page}
            </button>
          `).join('')}
          <button class="join-item btn btn-sm ${this.currentPage === totalPages ? 'btn-disabled' : ''}">
            »
          </button>
        </div>
      </div>
    `;
  }
}

export function dataTable<T extends Record<string, any>>(data: T[], props: Omit<DataTableProps<T>, 'data'>): DataTable<T> {
  return new DataTable({ data, ...props });
}
