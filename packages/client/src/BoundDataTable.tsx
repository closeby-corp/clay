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
  ArrowDown,
  ArrowUp,
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Columns3,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Inbox,
  Info,
  Link2,
  ListFilter,
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
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

type DataTableFacetOption = {
  value: string;
  label: string;
  count?: number;
};

type DataTableColumnEditor = 'text' | 'select' | 'number' | 'date' | 'boolean';
type DataTableDensity = 'compact' | 'default' | 'comfortable';

type DataTableColumn = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  filter?: 'text' | 'facet';
  facetOptions?: DataTableFacetOption[];
  editor?: DataTableColumnEditor;
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

function isFacetColumn(col: DataTableColumn): boolean {
  return col.filter === 'facet';
}

function parseFacetFilter(value: string | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v));
  } catch {
    return [];
  }
}

function serializeFacetFilter(values: string[]): string {
  return JSON.stringify(values);
}

function FacetColumnFilter({
  column,
  selected,
  onChange,
}: {
  column: DataTableColumn;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = column.facetOptions ?? [];
  const active = selected.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 gap-1 border-dashed px-2 font-normal',
            active && 'border-solid',
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Filter ${column.header}`}
        >
          <ListFilter className="size-3.5 text-muted-foreground" />
          {active ? (
            <Badge
              variant="secondary"
              className="h-5 rounded-sm px-1 font-normal"
            >
              {selected.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="max-h-64 overflow-auto p-1">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">No options</p>
          ) : (
            options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value === '' ? '__empty' : opt.value}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    const next = checked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value];
                    onChange(next);
                  }}
                >
                  <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {opt.count != null ? (
                    <span className="text-xs text-muted-foreground tabular-nums">{opt.count}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
        {active ? (
          <div className="border-t p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-center"
              onClick={() => onChange([])}
            >
              Clear filter
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
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
  density,
}: {
  column: DataTableColumn;
  value: unknown;
  onCommit: (next: unknown) => void;
  density: DataTableDensity;
}) {
  const inputHeight =
    density === 'compact' ? 'h-7' : density === 'comfortable' ? 'h-9' : 'h-8';

  const [local, setLocal] = useState(() => {
    if (column.editor === 'date') return String(value ?? '').slice(0, 10);
    return value == null ? '' : String(value);
  });
  useEffect(() => {
    if (column.editor === 'date') {
      setLocal(String(value ?? '').slice(0, 10));
    } else if (column.editor !== 'boolean' && column.editor !== 'select') {
      setLocal(value == null ? '' : String(value));
    }
  }, [value, column.editor]);

  if (column.editor === 'boolean') {
    const checked = value === true || value === 'true' || value === 1 || value === '1';
    return (
      <div
        className={cn(
          'flex items-center',
          column.align === 'right' && 'justify-end',
          column.align === 'center' && 'justify-center',
        )}
      >
        <Switch
          size="sm"
          checked={checked}
          onCheckedChange={(next) => onCommit(next)}
          aria-label={column.header}
        />
      </div>
    );
  }

  if (column.editor === 'select') {
    const options = column.editorOptions ?? [];
    const selectValue = String(value ?? '');
    return (
      <Select
        value={selectValue || undefined}
        onValueChange={(next) => {
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

  const inputType =
    column.editor === 'number' ? 'number' : column.editor === 'date' ? 'date' : 'text';

  const commit = () => {
    const prev =
      column.editor === 'date'
        ? String(value ?? '').slice(0, 10)
        : value == null
          ? ''
          : String(value);
    if (local === prev) return;
    if (column.editor === 'number') {
      if (local.trim() === '') {
        onCommit(null);
        return;
      }
      const n = Number(local);
      onCommit(Number.isFinite(n) ? n : local);
      return;
    }
    onCommit(local === '' ? null : local);
  };

  return (
    <Input
      type={inputType}
      className={cn(
        inputHeight,
        'border-transparent bg-transparent shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background',
        column.align === 'right' && 'text-right',
        column.align === 'center' && 'text-center',
        column.editor === 'number' || column.editor === 'date'
          ? 'min-w-24 w-28 max-w-40'
          : 'min-w-24 w-full max-w-48',
      )}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function ColumnResizeHandle({
  onResize,
}: {
  onResize: (deltaX: number) => void;
}) {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      if (dx !== 0) onResizeRef.current(dx);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      className="absolute top-0 right-0 z-20 h-full w-1 cursor-col-resize touch-none select-none bg-transparent hover:bg-border active:bg-primary/40"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging.current = true;
        lastX.current = e.clientX;
      }}
    />
  );
}

function densityCellPad(density: DataTableDensity): string {
  if (density === 'compact') return 'py-1';
  if (density === 'comfortable') return 'py-3';
  return '';
}

function densityHeadHeight(density: DataTableDensity): string {
  if (density === 'compact') return 'h-8';
  if (density === 'comfortable') return 'h-12';
  return '';
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
  className,
}: {
  rowKey: UniqueIdentifier;
  children: ReactNode;
  selected?: boolean;
  className?: string;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: rowKey });
  return (
    <TableRow
      ref={setNodeRef}
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80',
        className,
      )}
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
  const bulkActions = (props.bulkActions as DataTableActionProp[]) ?? [];
  const keyField = String(props.keyField ?? 'id');
  const searchable = props.searchable !== false;
  const columnFilterable = props.columnFilterable !== false;
  const columnToggle = props.columnToggle !== false;
  const exportable = props.exportable !== false;
  const loading = props.loading === true;
  const emptyTitle = String(props.emptyTitle ?? 'No rows');
  const emptyDescription = String(
    props.emptyDescription ?? 'No matching rows. Try adjusting search or filters.',
  );
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
  const density: DataTableDensity =
    props.density === 'compact' || props.density === 'comfortable'
      ? props.density
      : 'default';
  const zebra = props.zebra === true;
  const hiddenColumns = new Set((props.hiddenColumns as string[]) ?? []);
  const serverFilter = String(props.filter ?? '');
  const serverColumnFilters = (props.columnFilters as Record<string, string>) ?? {};
  const [filter, setFilter] = useOptimisticValue(serverFilter);
  const [columnFilters, setColumnFilters] = useOptimisticValue(serverColumnFilters);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [actionsMenuKey, setActionsMenuKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
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
  const showToolbar = searchable || columnToggle || exportable || !!primaryAction || grouped;
  const showBulkBar = selectable && bulkActions.length > 0 && selected.size > 0;
  const defaultViewId = views[0]?.id ?? '';
  const hasTextColumnFilters =
    columnFilterable && columns.some((col) => !isFacetColumn(col));

  const leadingCols = (reorderable ? 1 : 0) + (selectable ? 1 : 0);
  const trailingCols = actions.length > 0 ? 1 : 0;
  const colSpan = columns.length + leadingCols + trailingCols;
  const cellPad = densityCellPad(density);
  const headHeight = densityHeadHeight(density);

  const resizeColumn = (key: string, deltaX: number) => {
    setColumnWidths((prev) => {
      const current = prev[key] ?? 140;
      const next = Math.max(72, Math.min(480, current + deltaX));
      if (next === current) return prev;
      return { ...prev, [key]: next };
    });
  };

  const emitSelection = (next: Set<string>) => {
    setSelected(next);
    if (hasEvent(props, 'selectionChange')) {
      emit(id, 'selectionChange', { keys: [...next] });
    }
  };

  const emitColumnFilter = (key: string, value: string) => {
    if (hasEvent(props, 'columnFilter')) {
      emit(id, 'columnFilter', { key, value });
    }
  };

  const setFacetFilter = (key: string, values: string[]) => {
    const serialized = values.length === 0 ? '' : serializeFacetFilter(values);
    setColumnFilters({ ...columnFilters, [key]: serialized });
    emitColumnFilter(key, serialized);
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

  const collapseAllGroups = () => {
    const prev = collapsed;
    const next = new Set(groups.map((g) => g.key));
    setCollapsed(next);
    if (hasEvent(props, 'groupToggle')) {
      for (const g of groups) {
        if (!prev.has(g.key)) {
          emit(id, 'groupToggle', { groupKey: g.key, collapsed: true });
        }
      }
    }
  };

  const expandAllGroups = () => {
    const prev = collapsed;
    setCollapsed(new Set());
    if (hasEvent(props, 'groupToggle')) {
      for (const g of groups) {
        if (prev.has(g.key)) {
          emit(id, 'groupToggle', { groupKey: g.key, collapsed: false });
        }
      }
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
          density={density}
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

  const columnsMenu = columnToggle ? (
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
  ) : null;

  const exportMenu = exportable ? (
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
  ) : null;

  const primaryActionButton = primaryAction ? (
    <Button
      size="sm"
      onClick={() => {
        if (hasEvent(props, 'primaryAction')) emit(id, 'primaryAction');
      }}
    >
      <Plus className="size-4" />
      <span className="hidden lg:inline">{primaryAction.label}</span>
    </Button>
  ) : null;

  const groupChrome = grouped ? (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={collapseAllGroups}>
        Collapse all
      </Button>
      <Button variant="outline" size="sm" onClick={expandAllGroups}>
        Expand all
      </Button>
    </div>
  ) : null;

  const toolbar = showToolbar ? (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
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
        {groupChrome}
        {columnsMenu}
        {exportMenu}
        {primaryActionButton}
      </div>
    </div>
  ) : null;

  const bulkBar = showBulkBar ? (
    <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2">
      <span className="text-sm text-muted-foreground">
        {selected.size} row{selected.size === 1 ? '' : 's'} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {bulkActions.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
            onClick={() => {
              if (hasEvent(props, 'bulkAction')) {
                emit(id, 'bulkAction', { actionId: action.id, rowKeys: [...selected] });
              }
            }}
          >
            <ActionLabel action={action} />
          </Button>
        ))}
      </div>
    </div>
  ) : null;

  const tableBlock = (
    <DndContext
      id={`${tableId}-dnd`}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <Table
        containerClassName="max-h-[min(60vh,28rem)] overflow-auto"
        className={cn(density === 'compact' && 'text-xs', density === 'comfortable' && 'text-sm')}
        style={
          Object.keys(columnWidths).length > 0
            ? ({ tableLayout: 'fixed' } as CSSProperties)
            : undefined
        }
      >
        {Object.keys(columnWidths).length > 0 ? (
          <colgroup>
            {reorderable ? <col style={{ width: 32 }} /> : null}
            {selectable ? <col style={{ width: 32 }} /> : null}
            {columns.map((col) => (
              <col
                key={col.key}
                style={columnWidths[col.key] != null ? { width: columnWidths[col.key] } : undefined}
              />
            ))}
            {actions.length > 0 ? <col style={{ width: 40 }} /> : null}
          </colgroup>
        ) : null}
        <TableHeader className="sticky top-0 z-10 bg-muted [&_tr]:border-b">
          <TableRow className="hover:bg-transparent">
            {reorderable ? <TableHead className={cn('w-8 bg-muted', headHeight)} /> : null}
            {selectable ? (
              <TableHead className={cn('w-8 bg-muted', headHeight)}>
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
              const SortIcon = !active
                ? ChevronsUpDown
                : sortDir === 'asc'
                  ? ArrowUp
                  : ArrowDown;
              const facet = columnFilterable && isFacetColumn(col);
              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    'relative bg-muted',
                    headHeight,
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                  style={
                    columnWidths[col.key] != null
                      ? { width: columnWidths[col.key], minWidth: columnWidths[col.key] }
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      col.align === 'right' && 'justify-end',
                      col.align === 'center' && 'justify-center',
                    )}
                  >
                    {sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          '-ml-2 gap-1.5 px-2 font-medium',
                          density === 'compact' ? 'h-7' : 'h-8',
                        )}
                        onClick={() => {
                          if (!hasEvent(props, 'sort')) return;
                          const nextDir: 'asc' | 'desc' =
                            active && sortDir === 'asc' ? 'desc' : 'asc';
                          emit(id, 'sort', { key: col.key, dir: nextDir });
                        }}
                      >
                        {col.header}
                        <SortIcon className="size-3.5 text-muted-foreground" />
                      </Button>
                    ) : (
                      <span className="font-medium">{col.header}</span>
                    )}
                    {facet ? (
                      <FacetColumnFilter
                        column={col}
                        selected={parseFacetFilter(columnFilters[col.key])}
                        onChange={(values) => setFacetFilter(col.key, values)}
                      />
                    ) : null}
                  </div>
                  <ColumnResizeHandle onResize={(dx) => resizeColumn(col.key, dx)} />
                </TableHead>
              );
            })}
            {actions.length > 0 ? <TableHead className={cn('w-8 bg-muted', headHeight)} /> : null}
          </TableRow>
          {hasTextColumnFilters ? (
            <TableRow className="hover:bg-transparent">
              {reorderable ? <TableHead className="h-auto bg-muted pb-2 pt-0" /> : null}
              {selectable ? <TableHead className="h-auto bg-muted pb-2 pt-0" /> : null}
              {columns.map((col) => (
                <TableHead
                  key={`filter-${col.key}`}
                  className="h-auto bg-muted pb-2 pt-0 font-normal"
                >
                  {isFacetColumn(col) ? null : (
                    <Input
                      value={columnFilters[col.key] ?? ''}
                      placeholder="Filter…"
                      className={cn(density === 'compact' ? 'h-7' : 'h-8')}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const next = e.target.value;
                        setColumnFilters({ ...columnFilters, [col.key]: next });
                        if (columnDebounceRef.current) clearTimeout(columnDebounceRef.current);
                        columnDebounceRef.current = setTimeout(() => {
                          emitColumnFilter(col.key, next);
                        }, 150);
                      }}
                    />
                  )}
                </TableHead>
              ))}
              {actions.length > 0 ? <TableHead className="h-auto bg-muted pb-2 pt-0" /> : null}
            </TableRow>
          ) : null}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={Math.max(colSpan, 1)} className="h-48">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Spinner className="size-6" />
                  <span className="text-sm">Loading…</span>
                </div>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={Math.max(colSpan, 1)} className="h-48 p-0">
                <Empty className="border-0 p-8 md:p-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Inbox />
                    </EmptyMedia>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    <EmptyDescription>{emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
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
                      <TableCell colSpan={Math.max(colSpan, 1)} className={cn('py-2', cellPad)}>
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
                const zebraClass =
                  zebra && i % 2 === 1 ? 'bg-muted/30 hover:bg-muted/50' : undefined;
                return (
                  <SortableRow
                    key={rowKey}
                    rowKey={rowKey}
                    selected={isSelected}
                    className={zebraClass}
                  >
                    {reorderable ? (
                      <TableCell className={cn('w-8 px-1', cellPad)}>
                        <DragHandle id={rowKey} />
                      </TableCell>
                    ) : null}
                    {selectable ? (
                      <TableCell className={cn('w-8 px-1', cellPad)}>
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
                          cellPad,
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                        )}
                      >
                        {renderCellContent(row, col, rowKey)}
                      </TableCell>
                    ))}
                    {actions.length > 0 ? (
                      <TableCell className={cn('w-8 px-1', cellPad)}>
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
  );

  const footer = showPagination ? (
    <div className="flex items-center justify-between border-t px-4 py-3">
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

  const panel = (
    <div className="overflow-clip rounded-lg border">
      {toolbar}
      {bulkBar}
      {tableBlock}
      {footer}
    </div>
  );

  if (views.length === 0) {
    return (
      <div className={cn('flex w-full flex-col', className)} style={asStyle(style)}>
        {panel}
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
            {groupChrome}
            {columnsMenu}
            {primaryActionButton}
          </div>
        </div>

        {views.map((view) => (
          <TabsContent key={view.id} value={view.id} className="relative mt-0">
            <div className="overflow-clip rounded-lg border">
              {(searchable || exportable) && (
                <div className="flex items-center gap-2 border-b px-4 py-3">
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
                  <div className="ml-auto flex items-center gap-2">{exportMenu}</div>
                </div>
              )}
              {bulkBar}
              {tableBlock}
              {footer}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
