import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Archive,
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type Emit = (id: string, type: string, value?: unknown) => void;
type RenderNode = (node: ElementNode, emit: Emit) => ReactNode;

type DataTableColumn = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  editor?: 'text' | 'select';
  editorOptions?: { value: string; label: string }[];
  detailTrigger?: boolean;
};

type DataTableActionProp = {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

type DataTableView = {
  id: string;
  label: string;
  count?: number;
};

type DataTableGroup = {
  key: string;
  label: string;
  count: number;
};

type PrimaryAction = { id?: string; label: string };

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

function useOptimisticValue<T>(serverValue: T): [T, (next: T) => void] {
  const [local, setLocal] = useState(serverValue);
  const prev = useRef(serverValue);
  if (prev.current !== serverValue) {
    prev.current = serverValue;
    setLocal(serverValue);
  }
  return [local, setLocal];
}

function isUiCell(content: unknown): content is { __ui: ElementNode } {
  return (
    typeof content === 'object' &&
    content !== null &&
    '__ui' in content &&
    typeof (content as { __ui: unknown }).__ui === 'object'
  );
}

function renderTableCell(content: unknown, emit: Emit, renderNode: RenderNode): ReactNode {
  if (isUiCell(content)) {
    return renderNode(content.__ui, emit);
  }
  return <>{String(content ?? '')}</>;
}

function toPascalIconName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

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

function ActionLabel({
  action,
  iconClassName,
}: {
  action: DataTableActionProp;
  iconClassName?: string;
}) {
  const Icon = resolveLucideIcon(action.icon);
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon ? <Icon className={cn('size-3.5 shrink-0', iconClassName)} aria-hidden /> : null}
      <span>{action.label}</span>
    </span>
  );
}

function asStyle(style: unknown): CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === 'string') {
    const out: Record<string, string> = {};
    for (const part of style.split(';')) {
      const [k, ...rest] = part.split(':');
      if (!k || rest.length === 0) continue;
      const key = k.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      out[key] = rest.join(':').trim();
    }
    return out as CSSProperties;
  }
  return style as CSSProperties;
}

function DragHandle({ id }: { id: UniqueIdentifier }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVertical className="size-3.5" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function EditableCell({
  column,
  value,
  onCommit,
}: {
  column: DataTableColumn;
  value: unknown;
  onCommit: (next: unknown) => void;
}) {
  const [local, setLocal] = useState(String(value ?? ''));
  useEffect(() => {
    setLocal(String(value ?? ''));
  }, [value]);

  if (column.editor === 'select') {
    const options = column.editorOptions ?? [];
    return (
      <Select
        value={local || undefined}
        onValueChange={(next) => {
          setLocal(next);
          onCommit(next);
        }}
      >
        <SelectTrigger size="sm" className="w-38">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      className={cn(
        'h-8 border-transparent bg-transparent shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background',
        column.align === 'right' && 'text-right',
        column.align === 'center' && 'text-center',
        'w-16',
      )}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== String(value ?? '')) onCommit(local);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function DetailDrawer({
  trigger,
  detail,
  title,
  emit,
  renderNode,
}: {
  trigger: ReactNode;
  detail: unknown;
  title: string;
  emit: Emit;
  renderNode: RenderNode;
}) {
  const isMobile = useIsMobile();
  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>Row details</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
          {isUiCell(detail) ? (
            renderNode(detail.__ui, emit)
          ) : (
            <p className="text-muted-foreground">No detail content.</p>
          )}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SortableRow({
  rowKey,
  children,
  selected,
}: {
  rowKey: UniqueIdentifier;
  children: ReactNode;
  selected?: boolean;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: rowKey });
  return (
    <TableRow
      ref={setNodeRef}
      data-state={selected ? 'selected' : undefined}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      data-dragging={isDragging || undefined}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children}
    </TableRow>
  );
}

export function BoundDataTable({
  id,
  props,
  className,
  style,
  emit,
  renderNode,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
  renderNode: RenderNode;
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
  const selectable = props.selectable === true;
  const reorderable = props.reorderable === true;
  const views = (props.views as DataTableView[]) ?? [];
  const activeView = String(props.activeView ?? views[0]?.id ?? '');
  const groups = (props.groups as DataTableGroup[]) ?? [];
  const grouped = props.groupBy != null && props.groupBy !== false;
  const defaultCollapsed = props.defaultCollapsed === true;
  const primaryAction = props.primaryAction as PrimaryAction | null;
  const pageSizeOptions = (props.pageSizeOptions as number[]) ?? [10, 20, 30, 40, 50];
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    if (!defaultCollapsed || groups.length === 0) return new Set();
    return new Set(groups.map((g) => g.key));
  });
  const groupsKey = groups.map((g) => g.key).join('\0');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableId = useId();

  const dataIds = useMemo(
    () => rows.map((row, i) => String(row[keyField] ?? i)) as UniqueIdentifier[],
    [rows, keyField],
  );

  const visibleRows = useMemo(() => {
    if (!grouped) return rows;
    return rows.filter((row) => {
      const gk = String(row.__groupKey ?? '');
      return !collapsed.has(gk);
    });
  }, [rows, grouped, collapsed]);

  const visibleDataIds = useMemo(
    () => visibleRows.map((row, i) => String(row[keyField] ?? i)) as UniqueIdentifier[],
    [visibleRows, keyField],
  );

  useEffect(() => {
    setCollapsed((prev) => {
      const keys = groups.map((g) => g.key);
      if (defaultCollapsed) {
        const next = new Set(keys);
        if (next.size === prev.size && keys.every((k) => prev.has(k))) return prev;
        return next;
      }
      const keySet = new Set(keys);
      const next = new Set([...prev].filter((k) => keySet.has(k)));
      return next.size === prev.size ? prev : next;
    });
  }, [groupsKey, defaultCollapsed]); // eslint-disable-line react-hooks/exhaustive-deps -- groupsKey tracks group identity

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (columnDebounceRef.current) clearTimeout(columnDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    const keys = new Set(dataIds.map(String));
    setSelected((prev) => {
      const next = new Set([...prev].filter((k) => keys.has(k)));
      return next.size === prev.size ? prev : next;
    });
  }, [dataIds]);

  const showPagination = pageSize > 0;
  const showToolbar = searchable || columnToggle || exportable || !!primaryAction;
  const defaultViewId = views[0]?.id ?? '';

  const leadingCols = (reorderable ? 1 : 0) + (selectable ? 1 : 0);
  const trailingCols = actions.length > 0 ? 1 : 0;
  const colSpan = columns.length + leadingCols + trailingCols;

  const emitSelection = (next: Set<string>) => {
    setSelected(next);
    if (hasEvent(props, 'selectionChange')) {
      emit(id, 'selectionChange', { keys: [...next] });
    }
  };

  const toggleGroup = (groupKey: string) => {
    const next = new Set(collapsed);
    const willCollapse = !next.has(groupKey);
    if (willCollapse) next.add(groupKey);
    else next.delete(groupKey);
    setCollapsed(next);
    if (hasEvent(props, 'groupToggle')) {
      emit(id, 'groupToggle', { groupKey, collapsed: willCollapse });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = grouped ? visibleDataIds : dataIds;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove([...ids], oldIndex, newIndex);
    if (hasEvent(props, 'reorder')) {
      emit(id, 'reorder', { orderedKeys: reordered });
    }
  };

  const renderCellContent = (row: Record<string, unknown>, col: DataTableColumn, rowKey: string) => {
    const cells = row.__cells as Record<string, unknown> | undefined;
    const content = cells?.[col.key] ?? row[col.key];

    if (col.detailTrigger) {
      return (
        <DetailDrawer
          title={String(row[col.key] ?? col.header)}
          detail={row.__detail}
          emit={emit}
          renderNode={renderNode}
          trigger={
            <Button variant="link" className="h-auto w-fit px-0 text-left text-foreground">
              {renderTableCell(content, emit, renderNode)}
            </Button>
          }
        />
      );
    }

    if (col.editor) {
      return (
        <EditableCell
          column={col}
          value={row[col.key]}
          onCommit={(next) => {
            if (hasEvent(props, 'cellChange')) {
              emit(id, 'cellChange', { rowKey, columnKey: col.key, value: next });
            }
          }}
        />
      );
    }

    return renderTableCell(content, emit, renderNode);
  };

  type BodyItem =
    | { kind: 'group'; group: DataTableGroup }
    | { kind: 'row'; row: Record<string, unknown>; index: number };

  const bodyItems = useMemo((): BodyItem[] => {
    if (!grouped) {
      return rows.map((row, index) => ({ kind: 'row' as const, row, index }));
    }
    const meta = new Map(groups.map((g) => [g.key, g]));
    const items: BodyItem[] = [];
    let lastKey: string | null = null;
    rows.forEach((row, index) => {
      const gk = String(row.__groupKey ?? '');
      if (gk !== lastKey) {
        items.push({
          kind: 'group',
          group: meta.get(gk) ?? { key: gk, label: gk || '(Empty)', count: 0 },
        });
        lastKey = gk;
      }
      if (!collapsed.has(gk)) {
        items.push({ kind: 'row', row, index });
      }
    });
    return items;
  }, [rows, grouped, groups, collapsed]);

  const sortableIds = grouped ? visibleDataIds : dataIds;

  const tableBlock = (
    <div className="overflow-hidden rounded-lg border">
      <DndContext
        id={`${tableId}-dnd`}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="hover:bg-transparent">
              {reorderable ? <TableHead className="w-8" /> : null}
              {selectable ? (
                <TableHead className="w-8">
                  <Checkbox
                    checked={
                      sortableIds.length > 0 &&
                      sortableIds.every((rowId) => selected.has(String(rowId)))
                        ? true
                        : selected.size > 0
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        emitSelection(new Set(sortableIds.map(String)));
                      } else {
                        emitSelection(new Set());
                      }
                    }}
                    aria-label="Select all"
                  />
                </TableHead>
              ) : null}
              {columns.map((col) => {
                const sortable = col.sortable !== false && !col.editor && !col.detailTrigger;
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
              {actions.length > 0 ? <TableHead className="w-8" /> : null}
            </TableRow>
            {columnFilterable ? (
              <TableRow className="hover:bg-transparent">
                {reorderable ? <TableHead className="h-auto pb-2 pt-0" /> : null}
                {selectable ? <TableHead className="h-auto pb-2 pt-0" /> : null}
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
                <TableCell colSpan={Math.max(colSpan, 1)} className="h-24 text-center text-muted-foreground">
                  No rows
                </TableCell>
              </TableRow>
            ) : (
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {bodyItems.map((item) => {
                  if (item.kind === 'group') {
                    const isCollapsed = collapsed.has(item.group.key);
                    return (
                      <TableRow
                        key={`group:${item.group.key}`}
                        className="bg-muted/40 hover:bg-muted/40"
                      >
                        <TableCell colSpan={Math.max(colSpan, 1)} className="py-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-sm font-medium"
                            onClick={() => toggleGroup(item.group.key)}
                            aria-expanded={!isCollapsed}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span>{item.group.label}</span>
                            <Badge
                              variant="secondary"
                              className="h-5 rounded-full px-1.5 font-normal text-muted-foreground"
                            >
                              {item.group.count}
                            </Badge>
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const { row, index: i } = item;
                  const rowKey = String(row[keyField] ?? i);
                  const isSelected = selected.has(rowKey);
                  return (
                    <SortableRow key={rowKey} rowKey={rowKey} selected={isSelected}>
                      {reorderable ? (
                        <TableCell className="w-8 px-1">
                          <DragHandle id={rowKey} />
                        </TableCell>
                      ) : null}
                      {selectable ? (
                        <TableCell className="w-8 px-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(value) => {
                              const next = new Set(selected);
                              if (value) next.add(rowKey);
                              else next.delete(rowKey);
                              emitSelection(next);
                            }}
                            aria-label="Select row"
                          />
                        </TableCell>
                      ) : null}
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                          )}
                        >
                          {renderCellContent(row, col, rowKey)}
                        </TableCell>
                      ))}
                      {actions.length > 0 ? (
                        <TableCell className="w-8 px-1">
                          <DropdownMenu
                            open={actionsMenuKey === rowKey}
                            onOpenChange={(open) => {
                              setActionsMenuKey(open ? rowKey : null);
                              if (open) {
                                setColumnsOpen(false);
                                setExportOpen(false);
                              }
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                                size="icon"
                                aria-label="Open menu"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {actions.map((action, index) => (
                                <div key={action.id}>
                                  {index > 0 && action.variant === 'destructive' ? (
                                    <DropdownMenuSeparator />
                                  ) : null}
                                  <DropdownMenuItem
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
                                </div>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      ) : null}
                    </SortableRow>
                  );
                })}
              </SortableContext>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );

  const toolbar = showToolbar ? (
    <div className="flex items-center justify-between gap-2 px-0">
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
      ) : (
        <div />
      )}
      <div className="flex items-center gap-2">
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
              <Button variant="outline" size="sm">
                <Columns3 className="size-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {allColumns.map((col) => {
                const checked = !hiddenColumns.has(col.key);
                const onlyVisible = checked && allColumns.length - hiddenColumns.size <= 1;
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

        {primaryAction ? (
          <Button
            size="sm"
            onClick={() => {
              if (hasEvent(props, 'primaryAction')) emit(id, 'primaryAction');
            }}
          >
            <Plus className="size-4" />
            <span className="hidden lg:inline">{primaryAction.label}</span>
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;

  const footer = showPagination ? (
    <div className="flex items-center justify-between px-0">
      <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
        {selectable
          ? `${selected.size} of ${totalRows} row(s) selected.`
          : `Showing ${totalRows === 0 ? 0 : (page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalRows)} of ${totalRows}`}
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor={`${tableId}-rows`} className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              if (hasEvent(props, 'pageSize')) emit(id, 'pageSize', { pageSize: Number(value) });
            }}
          >
            <SelectTrigger size="sm" className="w-20" id={`${tableId}-rows`}>
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            disabled={page <= 1}
            onClick={() => {
              if (hasEvent(props, 'page')) emit(id, 'page', 1);
            }}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            disabled={page <= 1}
            onClick={() => {
              if (hasEvent(props, 'page')) emit(id, 'page', page - 1);
            }}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => {
              if (hasEvent(props, 'page')) emit(id, 'page', page + 1);
            }}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => {
              if (hasEvent(props, 'page')) emit(id, 'page', totalPages);
            }}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  const mainContent = (
    <div className="flex flex-col gap-4">
      {toolbar}
      {tableBlock}
      {footer}
    </div>
  );

  const viewTableContent = (
    <div className="relative flex flex-col gap-4">
      {searchable || exportable ? (
        <div className="flex items-center gap-2">
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
          {exportable ? (
            <DropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
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
      ) : null}
      {tableBlock}
      {footer}
    </div>
  );

  if (views.length === 0) {
    return (
      <div className={cn('flex w-full flex-col gap-4', className)} style={asStyle(style)}>
        {mainContent}
      </div>
    );
  }

  return (
    <div className={cn('flex w-full flex-col gap-4', className)} style={asStyle(style)}>
      <Tabs
        value={activeView || defaultViewId}
        onValueChange={(value) => {
          if (hasEvent(props, 'viewChange')) emit(id, 'viewChange', { viewId: value });
        }}
        className="gap-4"
      >
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${tableId}-view`} className="sr-only">
            View
          </Label>
          <Select
            value={activeView || defaultViewId}
            onValueChange={(value) => {
              if (hasEvent(props, 'viewChange')) emit(id, 'viewChange', { viewId: value });
            }}
          >
            <SelectTrigger className="@4xl/main:hidden flex w-fit" id={`${tableId}-view`} size="sm">
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              {views.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  {view.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TabsList className="@4xl/main:flex hidden">
            {views.map((view) => (
              <TabsTrigger key={view.id} value={view.id} className="gap-1">
                {view.label}
                {view.count != null ? (
                  <Badge
                    variant="secondary"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30 px-1"
                  >
                    {view.count}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2">
            {columnToggle || exportable || primaryAction ? (
              <>
                {columnToggle ? (
                  <DropdownMenu open={columnsOpen} onOpenChange={setColumnsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Columns3 className="size-4" />
                        <span className="hidden lg:inline">Customize Columns</span>
                        <span className="lg:hidden">Columns</span>
                        <ChevronDown className="size-4" />
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
                {primaryAction ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (hasEvent(props, 'primaryAction')) emit(id, 'primaryAction');
                    }}
                  >
                    <Plus className="size-4" />
                    <span className="hidden lg:inline">{primaryAction.label}</span>
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {views.map((view) => (
          <TabsContent key={view.id} value={view.id} className="relative flex flex-col gap-4">
            {viewTableContent}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
