import { Component } from '@badui/core';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableProps {
  columns: TableColumn[];
  rows: Record<string, string>[];
  zebra?: boolean;
  pinRows?: boolean;
  pinCols?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export class Table extends Component<TableProps> {
  render(): string {
    const classes = [
      'table',
      this.props.zebra ? 'table-zebra' : '',
      this.props.pinRows ? 'table-pin-rows' : '',
      this.props.pinCols ? 'table-pin-cols' : '',
      this.props.size && this.props.size !== 'md' ? `table-${this.props.size}` : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const head = `<thead><tr>${this.props.columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>`;
    const body = `<tbody>${this.props.rows.map((row) =>
      `<tr>${this.props.columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
    ).join('')}</tbody>`;

    return `<div id="${this.id}" class="overflow-x-auto"${this.getExtraStyles()}><table class="${classes}">${head}${body}</table></div>`;
  }
}

export function table(columns: TableColumn[], rows: Record<string, string>[], props?: Omit<TableProps, 'columns' | 'rows'>): Table {
  return new Table({ columns, rows, ...props });
}
