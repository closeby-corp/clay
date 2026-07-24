import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Archive,
  Ban,
  Check,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Info,
  Link2,
  Lock,
  Mail,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  Unlock,
  Upload,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ElementNode } from './protocol';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const KitchenSink = lazy(() => import('./KitchenSink'));

type Emit = (id: string, type: string, value?: unknown) => void;

const widthClass: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

const gapMap: Record<number, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
};

function gapClass(gap: unknown): string {
  const n = typeof gap === 'number' ? gap : Number(gap) || 2;
  return gapMap[n] ?? 'gap-2';
}

function asStyle(style: unknown): CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === 'string') return undefined;
  return style as CSSProperties;
}

/** Keep typing snappy over WebSocket: local value + reconcile from server props. */
function useOptimisticValue<T>(serverValue: T): [T, (next: T) => void] {
  const [local, setLocal] = useState(serverValue);
  useEffect(() => {
    setLocal(serverValue);
  }, [serverValue]);
  return [local, setLocal];
}

function BoundInput({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const serverValue = String(props.value ?? '');
  const [value, setValue] = useOptimisticValue(serverValue);

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Input
        type={String(props.type ?? 'text')}
        value={value}
        placeholder={String(props.placeholder ?? '')}
        disabled={!!props.disabled}
        style={asStyle(style)}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (hasEvent(props, 'input')) emit(id, 'input', next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
        }}
      />
    </div>
  );
}

function BoundTextarea({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const serverValue = String(props.value ?? '');
  const [value, setValue] = useOptimisticValue(serverValue);

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Textarea
        rows={Number(props.rows ?? 3)}
        value={value}
        placeholder={String(props.placeholder ?? '')}
        disabled={!!props.disabled}
        style={asStyle(style)}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (hasEvent(props, 'input')) emit(id, 'input', next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
        }}
      />
    </div>
  );
}

function BoundSelect({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const options = (props.options as Array<{ value: string; label: string }>) ?? [];
  const serverValue = String(props.value ?? '');
  const [value, setValue] = useOptimisticValue(serverValue);
  const selectValue = value === '' ? undefined : value;

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Select
        value={selectValue}
        disabled={!!props.disabled}
        onValueChange={(next) => {
          setValue(next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
        }}
      >
        <SelectTrigger style={asStyle(style)}>
          <SelectValue placeholder={String(props.placeholder ?? 'Select…')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BoundSlider({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const serverValue = Number(props.value ?? 0);
  const [value, setValue] = useOptimisticValue(serverValue);
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = Number(props.step ?? 1);

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)} style={asStyle(style)}>
      <div className="flex items-center justify-between text-sm">
        {props.label ? <Label>{String(props.label)}</Label> : <span />}
        {props.showValue ? <span className="text-muted-foreground">{String(value)}</span> : null}
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={!!props.disabled}
        onValueChange={([next]) => {
          const n = next ?? min;
          setValue(n);
          if (hasEvent(props, 'change')) emit(id, 'change', n);
        }}
      />
    </div>
  );
}

function BoundCheckbox({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const serverValue = !!props.value;
  const [checked, setChecked] = useOptimisticValue(serverValue);

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)} style={asStyle(style)}>
      <Checkbox
        id={`cb-${id}`}
        checked={checked}
        disabled={!!props.disabled}
        onCheckedChange={(next) => {
          const value = next === true;
          setChecked(value);
          if (hasEvent(props, 'change')) emit(id, 'change', value);
          if (hasEvent(props, 'input')) emit(id, 'input', value);
        }}
      />
      {props.label ? (
        <Label htmlFor={`cb-${id}`} className="font-normal">
          {String(props.label)}
        </Label>
      ) : null}
    </div>
  );
}

function isUiCell(value: unknown): value is { __ui: ElementNode } {
  if (!value || typeof value !== 'object') return false;
  const ui = (value as { __ui?: unknown }).__ui;
  return !!ui && typeof ui === 'object' && typeof (ui as ElementNode).type === 'string';
}

function renderTableCell(content: unknown, emit: Emit) {
  if (isUiCell(content)) {
    return <ElementRenderer node={content.__ui} emit={emit} />;
  }
  return <>{String(content ?? '')}</>;
}

type DataTableColumn = {
  key: string;
  header: string;
  align?: string;
  sortable?: boolean;
};

type DataTableActionProp = {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

function toPascalIconName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** Curated Lucide icons for DataTable actions (keeps the client bundle small). */
const ACTION_ICONS: Record<string, LucideIcon> = {
  Archive,
  Ban,
  Check,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Info,
  Link2,
  Lock,
  Mail,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  Unlock,
  Upload,
  User,
  X,
};

function resolveLucideIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  return ACTION_ICONS[toPascalIconName(name)] ?? null;
}

function ActionLabel({ action, iconClassName }: { action: DataTableActionProp; iconClassName?: string }) {
  const Icon = resolveLucideIcon(action.icon);
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon ? <Icon className={cn('size-3.5 shrink-0', iconClassName)} aria-hidden /> : null}
      <span>{action.label}</span>
    </span>
  );
}

function BoundDataTable({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const columns = (props.columns as DataTableColumn[]) ?? [];
  const allColumns = (props.allColumns as DataTableColumn[]) ?? columns;
  const rows = (props.rows as Record<string, unknown>[]) ?? [];
  const actions = (props.actions as DataTableActionProp[]) ?? [];
  const keyField = String(props.keyField ?? 'id');
  const searchable = props.searchable !== false;
  const columnFilterable = props.columnFilterable !== false;
  const columnToggle = props.columnToggle !== false;
  const exportable = props.exportable !== false;
  const sortKey = (props.sortKey as string | null) ?? null;
  const sortDir = (props.sortDir as 'asc' | 'desc') ?? 'asc';
  const page = Number(props.page ?? 1);
  const pageSize = Number(props.pageSize ?? 10);
  const totalRows = Number(props.totalRows ?? rows.length);
  const totalPages = Number(props.totalPages ?? 1);
  const hiddenColumns = new Set((props.hiddenColumns as string[]) ?? []);
  const serverFilter = String(props.filter ?? '');
  const serverColumnFilters = (props.columnFilters as Record<string, string>) ?? {};
  const [filter, setFilter] = useOptimisticValue(serverFilter);
  const [columnFilters, setColumnFilters] = useOptimisticValue(serverColumnFilters);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [actionsMenuKey, setActionsMenuKey] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (columnDebounceRef.current) clearTimeout(columnDebounceRef.current);
    };
  }, []);

  const showPagination = pageSize > 0;
  const rangeStart = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = totalRows === 0 ? 0 : Math.min(page * pageSize, totalRows);
  const showToolbar = searchable || columnToggle || exportable;

  return (
    <div className={cn('flex w-full flex-col gap-3', className)} style={asStyle(style)}>
      {showToolbar ? (
        <div className="flex flex-wrap items-start gap-2">
          {searchable ? (
            <Input
              value={filter}
              placeholder={String(props.searchPlaceholder ?? 'Search…')}
              className="max-w-sm"
              onChange={(e) => {
                const next = e.target.value;
                setFilter(next);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  if (hasEvent(props, 'filter')) emit(id, 'filter', next);
                }, 150);
              }}
            />
          ) : null}

          <div className="ml-auto flex flex-wrap items-start gap-2">
            {columnToggle ? (
              <DropdownMenu
                open={columnsOpen}
                onOpenChange={(open) => {
                  setColumnsOpen(open);
                  if (open) {
                    setExportOpen(false);
                    setActionsMenuKey(null);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {allColumns.map((col) => {
                    const checked = !hiddenColumns.has(col.key);
                    const onlyVisible =
                      checked && allColumns.length - hiddenColumns.size <= 1;
                    return (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={checked}
                        disabled={onlyVisible}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(next) => {
                          if (hasEvent(props, 'columnVisibility')) {
                            emit(id, 'columnVisibility', {
                              key: col.key,
                              visible: next === true,
                            });
                          }
                        }}
                      >
                        {col.header}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {exportable ? (
              <DropdownMenu
                open={exportOpen}
                onOpenChange={(open) => {
                  setExportOpen(open);
                  if (open) {
                    setColumnsOpen(false);
                    setActionsMenuKey(null);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(
                    [
                      ['download', 'csv', 'Download CSV'],
                      ['download', 'tsv', 'Download TSV'],
                      ['download', 'json', 'Download JSON'],
                      ['copy', 'csv', 'Copy CSV'],
                      ['copy', 'tsv', 'Copy TSV'],
                      ['copy', 'json', 'Copy JSON'],
                    ] as const
                  ).map(([mode, format, label]) => (
                    <DropdownMenuItem
                      key={`${mode}-${format}`}
                      onSelect={() => {
                        if (hasEvent(props, 'export')) {
                          emit(id, 'export', { format, mode });
                        }
                      }}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => {
                const sortable = col.sortable !== false;
                const active = sortKey === col.key;
                const indicator = !sortable ? '' : active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      sortable && 'cursor-pointer select-none',
                    )}
                    onClick={() => {
                      if (!sortable || !hasEvent(props, 'sort')) return;
                      const nextDir: 'asc' | 'desc' =
                        active && sortDir === 'asc' ? 'desc' : 'asc';
                      emit(id, 'sort', { key: col.key, dir: nextDir });
                    }}
                  >
                    {col.header}
                    {indicator}
                  </TableHead>
                );
              })}
              {actions.length > 0 ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
            {columnFilterable ? (
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead key={`filter-${col.key}`} className="h-auto pb-2 pt-0 font-normal">
                    <Input
                      value={columnFilters[col.key] ?? ''}
                      placeholder="Filter…"
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const next = e.target.value;
                        setColumnFilters({ ...columnFilters, [col.key]: next });
                        if (columnDebounceRef.current) clearTimeout(columnDebounceRef.current);
                        columnDebounceRef.current = setTimeout(() => {
                          if (hasEvent(props, 'columnFilter')) {
                            emit(id, 'columnFilter', { key: col.key, value: next });
                          }
                        }, 150);
                      }}
                    />
                  </TableHead>
                ))}
                {actions.length > 0 ? <TableHead className="h-auto pb-2 pt-0" /> : null}
              </TableRow>
            ) : null}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No rows
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => {
                const rowKey = row[keyField] ?? i;
                return (
                  <TableRow key={String(rowKey)}>
                    {columns.map((col) => {
                      const cells = row.__cells as Record<string, unknown> | undefined;
                      const content = cells?.[col.key] ?? row[col.key];
                      return (
                        <TableCell
                          key={col.key}
                          className={cn(
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                          )}
                        >
                          {renderTableCell(content, emit)}
                        </TableCell>
                      );
                    })}
                    {actions.length > 0 ? (
                      <TableCell className="text-right">
                        {actions.length <= 2 ? (
                          <div className="flex justify-end gap-1">
                            {actions.map((action) => (
                              <Button
                                key={action.id}
                                size="sm"
                                variant={action.variant ?? 'ghost'}
                                onClick={() => {
                                  if (hasEvent(props, 'action')) {
                                    emit(id, 'action', { actionId: action.id, rowKey });
                                  }
                                }}
                              >
                                <ActionLabel action={action} />
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <DropdownMenu
                            open={actionsMenuKey === String(rowKey)}
                            onOpenChange={(open) => {
                              setActionsMenuKey(open ? String(rowKey) : null);
                              if (open) {
                                setColumnsOpen(false);
                                setExportOpen(false);
                              }
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" aria-label="Row actions">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action) => (
                                <DropdownMenuItem
                                  key={action.id}
                                  className={
                                    action.variant === 'destructive'
                                      ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
                                      : undefined
                                  }
                                  onSelect={() => {
                                    if (hasEvent(props, 'action')) {
                                      emit(id, 'action', { actionId: action.id, rowKey });
                                    }
                                  }}
                                >
                                  <ActionLabel action={action} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Showing {rangeStart}–{rangeEnd} of {totalRows}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                if (hasEvent(props, 'page')) emit(id, 'page', page - 1);
              }}
            >
              Previous
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => {
                if (hasEvent(props, 'page')) emit(id, 'page', page + 1);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BoundDialog({
  id,
  props,
  className,
  style,
  emit,
  children,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
  children: ReactNode;
}) {
  const open = !!props.open;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && hasEvent(props, 'close')) emit(id, 'close');
      }}
    >
      <DialogContent className={cn('sm:max-w-md', className)} style={asStyle(style)}>
        {props.title ? (
          <DialogHeader>
            <DialogTitle>{String(props.title)}</DialogTitle>
          </DialogHeader>
        ) : (
          <DialogTitle className="sr-only">Dialog</DialogTitle>
        )}
        <div className="flex flex-col gap-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ElementRenderer({ node, emit }: { node: ElementNode; emit: Emit }) {
  const { id, type, props, children } = node;
  const className = props.className as string | undefined;
  const style = props.style;

  const renderChildren = () =>
    children.map((child) => <ElementRenderer key={child.id} node={child} emit={emit} />);

  switch (type) {
    case 'root':
      return <div className="min-h-screen">{renderChildren()}</div>;

    case 'app': {
      const title = String(props.title ?? '');
      const nav = (Array.isArray(props.nav) ? props.nav : []) as Array<{
        label: string;
        href: string;
        description?: string;
        active?: boolean;
      }>;

      const go = (href: string) => {
        if (href.startsWith('/')) {
          window.history.pushState({}, '', href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          window.location.href = href;
        }
      };

      return (
        <div className={cn('flex min-h-screen w-full bg-background', className)} style={asStyle(style)}>
          <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground md:w-64">
            {title ? (
              <div className="mb-6 px-2 text-lg font-semibold tracking-tight">{title}</div>
            ) : null}
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.href);
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-2 text-sm transition-colors duration-150',
                    item.active
                      ? 'bg-sidebar-accent font-medium text-sidebar-primary shadow-sm ring-1 ring-sidebar-ring/30'
                      : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <div>{item.label}</div>
                  {item.description ? (
                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">{item.description}</div>
                  ) : null}
                </a>
              ))}
            </nav>
          </aside>
          <main className="flex min-h-screen flex-1 justify-center overflow-y-auto px-6 py-8 md:px-10">
            <div className="badui-animate-in w-full max-w-5xl">{renderChildren()}</div>
          </main>
        </div>
      );
    }

    case 'refreshable':
      return <div className={cn('contents', className)}>{renderChildren()}</div>;

    case 'row':
      return (
        <div className={cn('flex flex-row flex-wrap items-center', gapClass(props.gap), className)} style={asStyle(style)}>
          {renderChildren()}
        </div>
      );

    case 'column':
      return (
        <div className={cn('flex flex-col', gapClass(props.gap), className)} style={asStyle(style)}>
          {renderChildren()}
        </div>
      );

    case 'container':
      return (
        <div
          className={cn(
            'w-full px-4',
            props.centered ? 'mx-auto' : '',
            widthClass[String(props.width ?? 'lg')] ?? 'max-w-lg',
            className,
          )}
          style={asStyle(style)}
        >
          {renderChildren()}
        </div>
      );

    case 'hero':
      return (
        <div className={cn('flex min-h-[70vh] flex-col items-center justify-center text-center', className)} style={asStyle(style)}>
          {renderChildren()}
        </div>
      );

    case 'card':
      return (
        <Card className={cn('w-full', className)} style={asStyle(style)}>
          {props.title ? (
            <CardHeader>
              <CardTitle>{String(props.title)}</CardTitle>
            </CardHeader>
          ) : null}
          <CardContent className={cn('flex flex-col pt-6', gapClass(props.gap))}>
            {renderChildren()}
          </CardContent>
        </Card>
      );

    case 'dialog':
      return (
        <BoundDialog id={id} props={props} className={className} style={style} emit={emit}>
          {renderChildren()}
        </BoundDialog>
      );

    case 'label':
      return (
        <div className={cn('text-base', className)} style={asStyle(style)}>
          {String(props.text ?? '')}
        </div>
      );

    case 'button':
      return (
        <Button
          variant={(props.variant as any) ?? 'default'}
          size={(props.size as any) ?? 'default'}
          disabled={!!props.disabled}
          className={className}
          style={asStyle(style)}
          onClick={() => {
            if (hasEvent(props, 'click')) emit(id, 'click');
          }}
        >
          {String(props.text ?? '')}
        </Button>
      );

    case 'input':
      return <BoundInput id={id} props={props} className={className} style={style} emit={emit} />;

    case 'textarea':
      return <BoundTextarea id={id} props={props} className={className} style={style} emit={emit} />;

    case 'checkbox':
      return <BoundCheckbox id={id} props={props} className={className} style={style} emit={emit} />;

    case 'select':
      return <BoundSelect id={id} props={props} className={className} style={style} emit={emit} />;

    case 'slider':
      return <BoundSlider id={id} props={props} className={className} style={style} emit={emit} />;

    case 'link':
      return (
        <a
          href={String(props.href ?? '#')}
          className={cn('text-primary underline-offset-4 hover:underline', className)}
          style={asStyle(style)}
          onClick={(e) => {
            const href = String(props.href ?? '');
            if (href.startsWith('/')) {
              e.preventDefault();
              window.history.pushState({}, '', href);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
        >
          {String(props.text ?? '')}
        </a>
      );

    case 'badge':
      return (
        <Badge
          variant={(props.variant as any) ?? 'default'}
          color={typeof props.color === 'string' ? props.color : undefined}
          className={className}
          style={asStyle(style)}
        >
          {String(props.text ?? '')}
        </Badge>
      );

    case 'alert':
      return (
        <Alert
          variant={props.variant === 'destructive' ? 'destructive' : 'default'}
          className={className}
          style={asStyle(style)}
        >
          <AlertDescription>{String(props.text ?? '')}</AlertDescription>
        </Alert>
      );

    case 'stat': {
      const items = (props.items as Array<{ title: string; value: string | number }>) ?? [];
      return (
        <div className={cn('grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4', className)} style={asStyle(style)}>
          {items.map((item, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    case 'datatable':
      return <BoundDataTable id={id} props={props} className={className} style={style} emit={emit} />;

    case 'kitchensink':
      return (
        <Suspense
          fallback={
            <div className="p-8 text-sm text-muted-foreground">Loading kitchen sink…</div>
          }
        >
          <KitchenSink />
        </Suspense>
      );

    default:
      return (
        <div data-unknown-type={type} className={className} style={asStyle(style)}>
          {renderChildren()}
        </div>
      );
  }
}
