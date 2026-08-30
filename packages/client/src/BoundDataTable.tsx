import {
  useEffect,
  useId,
  useLayoutEffect,
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
import { useVirtualizer } from '@tanstack/react-virtual';
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
  Pin,
  PinOff,
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  EditableCell,
  type DataTableColumnEditor,
  type DataTableDensity,
} from './data-table/EditableCell';
import { FilterChipsView } from './FilterChipsView';

/** Virtualize body once row count is large enough to matter. */
const VIRTUALIZE_THRESHOLD = 40;
const LEADING_COL_WIDTH = 32;
const ACTIONS_COL_WIDTH = 40;
const DEFAULT_COL_WIDTH = 140;
const MIN_COL_WIDTH = 72;
const MAX_COL_WIDTH = 480;

type Emit = (id: string, type: string, value?: unknown) => void;
type RenderNode = (node: ElementNode, emit: Emit) => ReactNode;

type DataTableFacetOption = {
  value: string;
  label: string;
  count?: number;
};

type DataTableSortDir = 'asc' | 'desc';
type DataTableSort = { key: string; dir: DataTableSortDir };
type DataTableColumnPin = 'left' | 'right';

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
  pin?: DataTableColumnPin;
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
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
    return (
      <div className="min-w-0 max-w-full overflow-hidden">{renderNode(content.__ui, emit)}</div>
    );
  }
  const text = String(content ?? '');
  return (
    <span className="block min-w-0 max-w-full truncate" title={text || undefined}>
      {text}
    </span>
  );
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

function TextColumnFilter({
  column,
  value,
  onChange,
  onCommit,
}: {
  column: DataTableColumn;
  value: string;
  onChange: (next: string) => void;
  onCommit: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value.trim().length > 0;
  const inputId = `dt-filter-${column.key}`;

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
              className="h-5 max-w-20 truncate rounded-sm px-1 font-normal"
            >
              {value.trim()}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <Label htmlFor={inputId} className="sr-only">
          Filter {column.header}
        </Label>
        <Input
          id={inputId}
          value={value}
          placeholder="Filter…"
          className="h-8"
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCommit(value);
              setOpen(false);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setOpen(false);
            }
          }}
        />
        {active ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-8 w-full justify-center"
            onClick={() => {
              onChange('');
              onCommit('');
            }}
          >
            Clear filter
          </Button>
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

function ColumnResizeHandle({
  onResizeStart,
  onResize,
}: {
  /** Capture the column's rendered width before drag; return it as the resize baseline. */
  onResizeStart: () => number;
  onResize: (width: number) => void;
}) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const onResizeStartRef = useRef(onResizeStart);
  const onResizeRef = useRef(onResize);
  onResizeStartRef.current = onResizeStart;
  onResizeRef.current = onResize;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const next = startWidth.current + (e.clientX - startX.current);
      onResizeRef.current(next);
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
        startX.current = e.clientX;
        startWidth.current = onResizeStartRef.current();
      }}
    />
  );
}

function densityCellPad(density: DataTableDensity): string {
  if (density === 'compact') return 'py-1';
  if (density === 'comfortable') return 'py-3';
  return 'py-2';
}

function densityHeadHeight(density: DataTableDensity): string {
  if (density === 'compact') return 'h-8';
  if (density === 'comfortable') return 'h-12';
  return '';
}

function resolveSorts(props: Record<string, unknown>): DataTableSort[] {
  const raw = props.sorts;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const key = String((entry as DataTableSort).key ?? '');
        if (!key) return null;
        const dir: DataTableSortDir =
          (entry as DataTableSort).dir === 'desc' ? 'desc' : 'asc';
        return { key, dir };
      })
      .filter((s): s is DataTableSort => s != null);
  }
  const sortKey = (props.sortKey as string | null) ?? null;
  if (!sortKey) return [];
  const sortDir: DataTableSortDir = props.sortDir === 'desc' ? 'desc' : 'asc';
  return [{ key: sortKey, dir: sortDir }];
}

function pinStickyStyle(
  pin: DataTableColumnPin | undefined,
  leftOffset: number | undefined,
  rightOffset: number | undefined,
  width: number | undefined,
  opts?: { zIndex?: number },
): CSSProperties | undefined {
  if (!pin) return undefined;
  // Always clamp sticky cells — without maxWidth, nowrap content paints over neighbors.
  const resolvedWidth = width != null && width > 0 ? width : DEFAULT_COL_WIDTH;
  const style: CSSProperties = {
    position: 'sticky',
    zIndex: opts?.zIndex ?? 2,
    width: resolvedWidth,
    minWidth: resolvedWidth,
    maxWidth: resolvedWidth,
    // Do not set overflow:hidden here — it clips the pin edge shadow.
  };
  if (pin === 'left' && leftOffset != null) style.left = leftOffset;
  if (pin === 'right' && rightOffset != null) style.right = rightOffset;
  return style;
}

/** Opaque fill so horizontally scrolled cells cannot show through sticky pins. */
function stickyCellBg(opts: {
  active: boolean;
  zebra?: boolean;
  selected?: boolean;
  tone?: 'body' | 'head' | 'footer';
}): string | undefined {
  if (!opts.active) return undefined;
  if (opts.selected) return 'bg-muted';
  if (opts.tone === 'head' || opts.tone === 'footer') return 'bg-muted';
  if (opts.zebra) return 'bg-muted';
  return 'bg-background';
}

/**
 * Gradient edge painted *outside* the sticky cell so it isn’t clipped by cell overflow.
 * Parent cell must be `relative overflow-visible`. Uses theme foreground so it works in light/dark.
 */
function PinEdgeShadow({
  side,
  visible,
}: {
  side: 'left' | 'right';
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 z-[5] w-3',
        side === 'left'
          ? 'left-full bg-gradient-to-r from-foreground/8 to-transparent'
          : 'right-full bg-gradient-to-l from-foreground/8 to-transparent',
      )}
    />
  );
}

function pinEdgeSide(
  columns: DataTableColumn[],
  col: DataTableColumn,
): 'left' | 'right' | null {
  if (col.pin === 'left' && isLastLeftPin(columns, col.key)) return 'left';
  if (col.pin === 'right' && isFirstRightPin(columns, col.key)) return 'right';
  return null;
}

function leadingStickyStyle(
  enabled: boolean,
  left: number,
  zIndex = 3,
): CSSProperties | undefined {
  if (!enabled) return undefined;
  return { position: 'sticky', left, zIndex };
}

function trailingStickyStyle(
  enabled: boolean,
  right: number,
  zIndex = 3,
): CSSProperties | undefined {
  if (!enabled) return undefined;
  return { position: 'sticky', right, zIndex };
}

function isLastLeftPin(columns: DataTableColumn[], key: string): boolean {
  let last: string | null = null;
  for (const col of columns) {
    if (col.pin === 'left') last = col.key;
  }
  return last === key;
}

function isFirstRightPin(columns: DataTableColumn[], key: string): boolean {
  for (const col of columns) {
    if (col.pin === 'right') return col.key === key;
  }
  return false;
}

function aggregateLabel(kind: DataTableColumn['aggregate']): string {
  switch (kind) {
    case 'sum':
      return 'Sum';
    case 'avg':
      return 'Average';
    case 'count':
      return 'Count';
    case 'min':
      return 'Min';
    case 'max':
      return 'Max';
    default:
      return 'Total';
  }
}

function estimatedBodyRowHeight(density: DataTableDensity, kind: 'row' | 'group'): number {
  if (kind === 'group') return density === 'compact' ? 36 : density === 'comfortable' ? 44 : 40;
  if (density === 'compact') return 33;
  if (density === 'comfortable') return 49;
  return 41;
}

function ariaSortValue(
  active: boolean,
  dir: DataTableSortDir,
): 'ascending' | 'descending' | 'none' {
  if (!active) return 'none';
  return dir === 'desc' ? 'descending' : 'ascending';
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
  measureRef,
  dataIndex,
}: {
  rowKey: UniqueIdentifier;
  children: ReactNode;
  selected?: boolean;
  className?: string;
  measureRef?: (node: HTMLTableRowElement | null) => void;
  dataIndex?: number;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: rowKey });
  const setRefs = (node: HTMLTableRowElement | null) => {
    setNodeRef(node);
    measureRef?.(node);
  };
  return (
    <TableRow
      ref={setRefs}
      data-index={dataIndex}
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
  const sorts = resolveSorts(props);
  const sortIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    sorts.forEach((s, i) => map.set(s.key, i));
    return map;
  }, [sorts]);
  const footerCells = (props.footer as Record<string, unknown> | null) ?? null;
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
  const filterDebounceMs =
    props.filterDebounceMs != null && Number.isFinite(Number(props.filterDebounceMs))
      ? Math.max(0, Math.floor(Number(props.filterDebounceMs)))
      : 300;
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
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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
  const showFilterChips = props.showFilterChips === true;
  const showToolbar = searchable || columnToggle || exportable || !!primaryAction || grouped;
  const showBulkBar = selectable && bulkActions.length > 0 && selected.size > 0;
  const defaultViewId = views[0]?.id ?? '';

  const leadingCols = (reorderable ? 1 : 0) + (selectable ? 1 : 0);
  const trailingCols = actions.length > 0 ? 1 : 0;
  const colSpan = columns.length + leadingCols + trailingCols;
  const cellPad = densityCellPad(density);
  const headHeight = densityHeadHeight(density);
  const leadingStickyWidth =
    (reorderable ? LEADING_COL_WIDTH : 0) + (selectable ? LEADING_COL_WIDTH : 0);
  const trailingStickyWidth = actions.length > 0 ? ACTIONS_COL_WIDTH : 0;
  const defaultColWidth = DEFAULT_COL_WIDTH;

  const clampColumnWidth = (width: number) =>
    Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, Math.round(width)));

  const { leftOffsets, rightOffsets } = useMemo(() => {
    const leftOffsets: Record<string, number> = {};
    const rightOffsets: Record<string, number> = {};
    let left = leadingStickyWidth;
    for (const col of columns) {
      if (col.pin === 'left') {
        leftOffsets[col.key] = left;
        left += columnWidths[col.key] ?? defaultColWidth;
      }
    }
    let right = trailingStickyWidth;
    for (let i = columns.length - 1; i >= 0; i--) {
      const col = columns[i]!;
      if (col.pin === 'right') {
        rightOffsets[col.key] = right;
        right += columnWidths[col.key] ?? defaultColWidth;
      }
    }
    return { leftOffsets, rightOffsets };
  }, [columns, columnWidths, leadingStickyWidth, trailingStickyWidth, defaultColWidth]);

  const hasLeftPins = columns.some((c) => c.pin === 'left');
  const hasRightPins = columns.some((c) => c.pin === 'right');
  const showFooterRow = footerCells != null && Object.keys(footerCells).length > 0;
  const pinOffsetsNeedMeasure = hasLeftPins || hasRightPins;
  const [pinScrollShadow, setPinScrollShadow] = useState({ left: false, right: false });

  /** Keep sticky offsets accurate once pins are active (avoid default-width drift). */
  useLayoutEffect(() => {
    if (!pinOffsetsNeedMeasure) return;
    setColumnWidths((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const col of columns) {
        if (!col.pin) continue;
        if (next[col.key] != null) continue;
        const el = headerCellRefs.current[col.key];
        if (el != null && el.offsetWidth > 0) {
          next[col.key] = clampColumnWidth(el.offsetWidth);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [columns, pinOffsetsNeedMeasure, density, headHeight]); // eslint-disable-line react-hooks/exhaustive-deps -- measure when pin layout chrome changes

  const tableMinWidth = useMemo(() => {
    if (!hasLeftPins && !hasRightPins) return undefined;
    let min = leadingStickyWidth + trailingStickyWidth;
    for (const col of columns) {
      if (col.pin) {
        min += columnWidths[col.key] ?? defaultColWidth;
      } else {
        min += MIN_COL_WIDTH;
      }
    }
    return min;
  }, [
    columns,
    columnWidths,
    defaultColWidth,
    hasLeftPins,
    hasRightPins,
    leadingStickyWidth,
    trailingStickyWidth,
  ]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || (!hasLeftPins && !hasRightPins)) {
      setPinScrollShadow({ left: false, right: false });
      return;
    }
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      setPinScrollShadow({
        left: hasLeftPins && scrollLeft > 0.5,
        right: hasRightPins && maxScroll > 0.5 && scrollLeft < maxScroll - 0.5,
      });
    };
    update();
    const raf = requestAnimationFrame(update);
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, [hasLeftPins, hasRightPins, columns.length, tableMinWidth, columnWidths]);

  /** Seed explicit widths from rendered <th>s so the first drag doesn't jump from a default. */
  const beginColumnResize = (key: string): number => {
    const seeded: Record<string, number> = {};
    for (const col of columns) {
      const existing = columnWidths[col.key];
      if (existing != null) {
        seeded[col.key] = existing;
        continue;
      }
      const el = headerCellRefs.current[col.key];
      seeded[col.key] = el != null && el.offsetWidth > 0 ? el.offsetWidth : defaultColWidth;
    }
    setColumnWidths((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [k, w] of Object.entries(seeded)) {
        if (next[k] == null) {
          next[k] = w;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    return seeded[key] ?? columnWidths[key] ?? defaultColWidth;
  };

  const setColumnWidth = (key: string, width: number) => {
    const next = clampColumnWidth(width);
    setColumnWidths((prev) => {
      if (prev[key] === next) return prev;
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

  const scheduleFilterEmit = (next: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const run = () => {
      debounceRef.current = null;
      if (hasEvent(props, 'filter')) emit(id, 'filter', next);
    };
    if (filterDebounceMs <= 0) {
      run();
      return;
    }
    debounceRef.current = setTimeout(run, filterDebounceMs);
  };

  const scheduleColumnFilterEmit = (key: string, next: string) => {
    if (columnDebounceRef.current) clearTimeout(columnDebounceRef.current);
    const run = () => {
      columnDebounceRef.current = null;
      emitColumnFilter(key, next);
    };
    if (filterDebounceMs <= 0) {
      run();
      return;
    }
    columnDebounceRef.current = setTimeout(run, filterDebounceMs);
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
            <Button
              variant="link"
              className="h-auto max-w-full min-w-0 truncate px-0 text-left text-foreground"
            >
              {renderTableCell(content, emit, renderNode)}
            </Button>
          }
        />
      );
    }

    if (col.editor) {
      return (
        <div className="min-w-0 max-w-full overflow-hidden">
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
        </div>
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

  /**
   * Virtualize large bodies even when reorderable. SortableContext keeps the full
   * id list; only mounted (windowed) rows register drop targets — drag near the
   * scroll edge to bring more rows into the window (dnd-kit auto-scroll).
   */
  const shouldVirtualize =
    !loading && rows.length > 0 && bodyItems.length >= VIRTUALIZE_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? bodyItems.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) =>
      estimatedBodyRowHeight(density, bodyItems[index]?.kind === 'group' ? 'group' : 'row'),
    // Extra overscan when reorderable so nearby drop targets stay mounted while dragging.
    overscan: reorderable ? 16 : 10,
  });

  const virtualRows = shouldVirtualize ? rowVirtualizer.getVirtualItems() : null;
  const virtualPadTop = virtualRows && virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const virtualPadBottom =
    virtualRows && virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
      : 0;

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
            scheduleFilterEmit(next);
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

  const activeFilterChips = useMemo(() => {
    if (!showFilterChips) return [];
    const chips: Array<{ id: string; label: string; value?: string }> = [];
    if (filter.trim()) {
      chips.push({ id: '__search', label: 'Search', value: filter.trim() });
    }
    for (const col of columns) {
      const raw = columnFilters[col.key];
      if (!raw) continue;
      let value = raw;
      if (isFacetColumn(col)) {
        const parsed = parseFacetFilter(raw);
        if (parsed.length === 0) continue;
        value = parsed.join(', ');
      }
      chips.push({ id: col.key, label: col.header, value });
    }
    return chips;
  }, [showFilterChips, filter, columnFilters, columns]);

  const filterChipBar =
    showFilterChips && activeFilterChips.length > 0 ? (
      <div className="border-b px-4 py-2">
        <FilterChipsView
          chips={activeFilterChips}
          onRemoveChip={(chipId) => {
            if (chipId === '__search') {
              setFilter('');
              scheduleFilterEmit('');
              return;
            }
            const next = { ...columnFilters, [chipId]: '' };
            setColumnFilters(next);
            scheduleColumnFilterEmit(chipId, '');
          }}
          onClear={() => {
            setFilter('');
            scheduleFilterEmit('');
            const next = { ...columnFilters };
            for (const key of Object.keys(next)) next[key] = '';
            setColumnFilters(next);
            for (const key of Object.keys(columnFilters)) {
              if (columnFilters[key]) scheduleColumnFilterEmit(key, '');
            }
          }}
        />
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

  const selectLeftOffset = reorderable ? LEADING_COL_WIDTH : 0;

  const renderGroupRow = (
    item: Extract<BodyItem, { kind: 'group' }>,
    rowOpts?: {
      key?: string;
      measureRef?: (node: HTMLTableRowElement | null) => void;
      dataIndex?: number;
    },
  ) => {
    const isCollapsed = collapsed.has(item.group.key);
    return (
      <TableRow
        key={rowOpts?.key ?? `group:${item.group.key}`}
        ref={rowOpts?.measureRef}
        data-index={rowOpts?.dataIndex}
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
  };

  const renderDataRowCells = (
    row: Record<string, unknown>,
    i: number,
    rowKey: string,
    isSelected: boolean,
  ) => (
    <>
      {reorderable ? (
        <TableCell
          className={cn(
            'w-8 overflow-hidden px-1',
            cellPad,
            stickyCellBg({
              active: hasLeftPins,
              zebra: zebra && i % 2 === 1,
              selected: isSelected,
            }),
            hasLeftPins && 'sticky left-0 z-[4]',
          )}
          style={leadingStickyStyle(hasLeftPins, 0, 4)}
        >
          <DragHandle id={rowKey} />
        </TableCell>
      ) : null}
      {selectable ? (
        <TableCell
          className={cn(
            'w-8 overflow-hidden px-1',
            cellPad,
            stickyCellBg({
              active: hasLeftPins,
              zebra: zebra && i % 2 === 1,
              selected: isSelected,
            }),
            hasLeftPins && 'sticky z-[4]',
          )}
          style={leadingStickyStyle(hasLeftPins, selectLeftOffset, 4)}
        >
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
      {columns.map((col) => {
        const pinWidth = columnWidths[col.key] ?? (col.pin ? defaultColWidth : undefined);
        const pinStyle = pinStickyStyle(
          col.pin,
          leftOffsets[col.key],
          rightOffsets[col.key],
          pinWidth,
          { zIndex: 3 },
        );
        const edge = pinEdgeSide(columns, col);
        return (
          <TableCell
            key={col.key}
            className={cn(
              'relative max-w-0',
              // Override base table cell overflow so the edge gradient can paint outside.
              col.pin ? 'overflow-visible' : 'overflow-hidden',
              cellPad,
              col.align === 'right' && 'text-right',
              col.align === 'center' && 'text-center',
              stickyCellBg({
                active: !!col.pin,
                zebra: zebra && i % 2 === 1,
                selected: isSelected,
              }),
            )}
            style={pinStyle}
          >
            {edge ? (
              <PinEdgeShadow
                side={edge}
                visible={edge === 'left' ? pinScrollShadow.left : pinScrollShadow.right}
              />
            ) : null}
            <div className="relative min-w-0 max-w-full overflow-hidden">
              {renderCellContent(row, col, rowKey)}
            </div>
          </TableCell>
        );
      })}
      {actions.length > 0 ? (
        <TableCell
          className={cn(
            'w-8 overflow-hidden px-1',
            cellPad,
            stickyCellBg({
              active: hasRightPins,
              zebra: zebra && i % 2 === 1,
              selected: isSelected,
            }),
            hasRightPins && 'sticky z-[4]',
          )}
          style={trailingStickyStyle(hasRightPins, 0, 4)}
        >
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
    </>
  );

  const renderDataRow = (
    item: Extract<BodyItem, { kind: 'row' }>,
    rowOpts?: {
      key?: string;
      measureRef?: (node: HTMLTableRowElement | null) => void;
      dataIndex?: number;
    },
  ) => {
    const { row, index: i } = item;
    const rowKey = String(row[keyField] ?? i);
    const isSelected = selected.has(rowKey);
    const zebraClass = zebra && i % 2 === 1 ? 'bg-muted/30 hover:bg-muted/50' : undefined;
    const cells = renderDataRowCells(row, i, rowKey, isSelected);
    if (reorderable) {
      return (
        <SortableRow
          key={rowOpts?.key ?? rowKey}
          rowKey={rowKey}
          selected={isSelected}
          className={zebraClass}
          measureRef={rowOpts?.measureRef}
          dataIndex={rowOpts?.dataIndex}
        >
          {cells}
        </SortableRow>
      );
    }
    return (
      <TableRow
        key={rowOpts?.key ?? rowKey}
        ref={rowOpts?.measureRef}
        data-index={rowOpts?.dataIndex}
        data-state={isSelected ? 'selected' : undefined}
        className={zebraClass}
      >
        {cells}
      </TableRow>
    );
  };

  const renderBodyItem = (
    item: BodyItem,
    rowOpts?: {
      key?: string;
      measureRef?: (node: HTMLTableRowElement | null) => void;
      dataIndex?: number;
    },
  ) => {
    if (item.kind === 'group') return renderGroupRow(item, rowOpts);
    return renderDataRow(item, rowOpts);
  };

  const tableInner = (
    <Table
      containerRef={scrollContainerRef}
      containerClassName="max-h-[min(60vh,28rem)] overflow-auto"
      className={cn(
        'table-fixed w-full',
        density === 'compact' && 'text-xs',
        density === 'comfortable' && 'text-sm',
      )}
      style={
        {
          width: '100%',
          ...(tableMinWidth != null ? { minWidth: tableMinWidth } : null),
        } as CSSProperties
      }
    >
      <colgroup>
        {reorderable ? <col style={{ width: LEADING_COL_WIDTH }} /> : null}
        {selectable ? <col style={{ width: LEADING_COL_WIDTH }} /> : null}
        {columns.map((col) => (
          <col
            key={col.key}
            style={{
              width:
                columnWidths[col.key] ??
                (col.pin ? defaultColWidth : undefined),
            }}
          />
        ))}
        {actions.length > 0 ? <col style={{ width: ACTIONS_COL_WIDTH }} /> : null}
      </colgroup>
      <TableHeader className="sticky top-0 z-10 bg-muted [&_tr]:border-b">
        <TableRow className="hover:bg-transparent">
          {reorderable ? (
            <TableHead
              className={cn(
                'w-8 overflow-hidden bg-muted',
                headHeight,
                hasLeftPins && 'sticky z-[5]',
              )}
              style={leadingStickyStyle(hasLeftPins, 0, 5)}
            />
          ) : null}
          {selectable ? (
            <TableHead
              className={cn(
                'w-8 overflow-hidden bg-muted',
                headHeight,
                hasLeftPins && 'sticky z-[5]',
              )}
              style={leadingStickyStyle(hasLeftPins, selectLeftOffset, 5)}
            >
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
            const sortIdx = sortIndexByKey.get(col.key);
            const active = sortIdx != null;
            const sortDir = active ? sorts[sortIdx!]!.dir : 'asc';
            const SortIcon = !active
              ? ChevronsUpDown
              : sortDir === 'asc'
                ? ArrowUp
                : ArrowDown;
            const facet = columnFilterable && isFacetColumn(col);
            const pinWidth = columnWidths[col.key] ?? (col.pin ? defaultColWidth : undefined);
            const pinStyle = pinStickyStyle(
              col.pin,
              leftOffsets[col.key],
              rightOffsets[col.key],
              pinWidth,
              { zIndex: 4 },
            );
            const edge = pinEdgeSide(columns, col);
            const pinStateLabel =
              col.pin === 'left' ? 'pinned left' : col.pin === 'right' ? 'pinned right' : 'unpinned';
            return (
              <TableHead
                key={col.key}
                ref={(el) => {
                  headerCellRefs.current[col.key] = el;
                }}
                aria-sort={sortable ? ariaSortValue(active, sortDir) : undefined}
                className={cn(
                  'relative max-w-0 bg-muted',
                  col.pin ? 'overflow-visible' : 'overflow-hidden',
                  headHeight,
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.pin && 'z-[4]',
                )}
                style={{
                  ...pinStyle,
                  ...(columnWidths[col.key] != null && !col.pin
                    ? {
                        width: columnWidths[col.key],
                        minWidth: columnWidths[col.key],
                        maxWidth: columnWidths[col.key],
                      }
                    : null),
                }}
              >
                {edge ? (
                  <PinEdgeShadow
                    side={edge}
                    visible={edge === 'left' ? pinScrollShadow.left : pinScrollShadow.right}
                  />
                ) : null}
                <div
                  className={cn(
                    'relative flex min-w-0 items-center gap-0.5 overflow-hidden',
                    col.align === 'right' && 'justify-end',
                    col.align === 'center' && 'justify-center',
                  )}
                >
                  {sortable ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            '-ml-2 min-w-0 gap-1.5 px-2 font-medium',
                            density === 'compact' ? 'h-7' : 'h-8',
                          )}
                          aria-label={
                            active
                              ? `${col.header}, sorted ${sortDir}${sorts.length > 1 ? `, sort priority ${sortIdx! + 1}` : ''}`
                              : `Sort ${col.header}`
                          }
                          onClick={(e) => {
                            if (!hasEvent(props, 'sort')) return;
                            const multi = e.shiftKey;
                            if (multi) {
                              emit(id, 'sort', { key: col.key, multi: true });
                              return;
                            }
                            const nextDir: DataTableSortDir =
                              active && sortDir === 'asc' ? 'desc' : 'asc';
                            emit(id, 'sort', { key: col.key, dir: nextDir });
                          }}
                        >
                          <span className="truncate">{col.header}</span>
                          <SortIcon
                            className="size-3.5 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          {active && sorts.length > 1 ? (
                            <span
                              className="shrink-0 text-[10px] font-semibold text-muted-foreground tabular-nums"
                              aria-hidden
                            >
                              {sortIdx! + 1}
                            </span>
                          ) : null}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Click to sort · Shift+click for multi-sort
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="min-w-0 truncate font-medium">
                      {col.header}
                      {col.aggregate ? (
                        <span className="sr-only">
                          {` (${aggregateLabel(col.aggregate)} in footer)`}
                        </span>
                      ) : null}
                    </span>
                  )}
                  {facet ? (
                    <FacetColumnFilter
                      column={col}
                      selected={parseFacetFilter(columnFilters[col.key])}
                      onChange={(values) => setFacetFilter(col.key, values)}
                    />
                  ) : columnFilterable ? (
                    <TextColumnFilter
                      column={col}
                      value={columnFilters[col.key] ?? ''}
                      onChange={(next) => {
                        setColumnFilters({ ...columnFilters, [col.key]: next });
                        scheduleColumnFilterEmit(col.key, next);
                      }}
                      onCommit={(next) => {
                        if (columnDebounceRef.current) clearTimeout(columnDebounceRef.current);
                        setColumnFilters({ ...columnFilters, [col.key]: next });
                        emitColumnFilter(col.key, next);
                      }}
                    />
                  ) : null}
                  {hasEvent(props, 'columnPin') ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-7 shrink-0 text-muted-foreground',
                            col.pin && 'text-foreground',
                          )}
                          title="Pin column"
                          aria-label={`${col.header} column options, ${pinStateLabel}`}
                          aria-pressed={col.pin != null}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.pin ? (
                            <Pin className="size-3.5" aria-hidden />
                          ) : (
                            <MoreHorizontal className="size-3.5" aria-hidden />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {sortable && hasEvent(props, 'sort') ? (
                          <>
                            <DropdownMenuItem
                              onSelect={() =>
                                emit(id, 'sort', { key: col.key, multi: true })
                              }
                            >
                              <ChevronsUpDown className="size-3.5" />
                              Add to multi-sort
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        ) : null}
                        <DropdownMenuItem
                          onSelect={() =>
                            emit(id, 'columnPin', {
                              key: col.key,
                              pin: col.pin === 'left' ? null : 'left',
                            })
                          }
                        >
                          <Pin className="size-3.5" />
                          {col.pin === 'left' ? 'Unpin left' : 'Pin left'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            emit(id, 'columnPin', {
                              key: col.key,
                              pin: col.pin === 'right' ? null : 'right',
                            })
                          }
                        >
                          <Pin className="size-3.5 rotate-45" />
                          {col.pin === 'right' ? 'Unpin right' : 'Pin right'}
                        </DropdownMenuItem>
                        {col.pin ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              emit(id, 'columnPin', { key: col.key, pin: null })
                            }
                          >
                            <PinOff className="size-3.5" />
                            Clear pin
                          </DropdownMenuItem>
                        ) : null}
                        {col.aggregate ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                              Footer: {aggregateLabel(col.aggregate)}
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
                <ColumnResizeHandle
                  onResizeStart={() => beginColumnResize(col.key)}
                  onResize={(width) => setColumnWidth(col.key, width)}
                />
              </TableHead>
            );
          })}
          {actions.length > 0 ? (
            <TableHead
              className={cn(
                'overflow-hidden bg-muted',
                headHeight,
                hasRightPins && 'sticky z-[5]',
              )}
              style={{
                ...trailingStickyStyle(hasRightPins, 0, 5),
                width: ACTIONS_COL_WIDTH,
                minWidth: ACTIONS_COL_WIDTH,
                maxWidth: ACTIONS_COL_WIDTH,
              }}
            />
          ) : null}
        </TableRow>
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
        ) : shouldVirtualize ? (
          <>
            {virtualPadTop > 0 ? (
              <TableRow className="hover:bg-transparent" aria-hidden>
                <TableCell
                  colSpan={Math.max(colSpan, 1)}
                  className="border-0 p-0"
                  style={{ height: virtualPadTop }}
                />
              </TableRow>
            ) : null}
            {reorderable ? (
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {virtualRows!.map((virtualRow) => {
                  const item = bodyItems[virtualRow.index]!;
                  return renderBodyItem(item, {
                    key:
                      item.kind === 'group'
                        ? `group:${item.group.key}`
                        : String(item.row[keyField] ?? item.index),
                    dataIndex: virtualRow.index,
                    measureRef: rowVirtualizer.measureElement,
                  });
                })}
              </SortableContext>
            ) : (
              virtualRows!.map((virtualRow) => {
                const item = bodyItems[virtualRow.index]!;
                return renderBodyItem(item, {
                  key:
                    item.kind === 'group'
                      ? `group:${item.group.key}`
                      : String(item.row[keyField] ?? item.index),
                  dataIndex: virtualRow.index,
                  measureRef: rowVirtualizer.measureElement,
                });
              })
            )}
            {virtualPadBottom > 0 ? (
              <TableRow className="hover:bg-transparent" aria-hidden>
                <TableCell
                  colSpan={Math.max(colSpan, 1)}
                  className="border-0 p-0"
                  style={{ height: virtualPadBottom }}
                />
              </TableRow>
            ) : null}
          </>
        ) : reorderable ? (
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {bodyItems.map((item) => renderBodyItem(item))}
          </SortableContext>
        ) : (
          bodyItems.map((item) => renderBodyItem(item))
        )}
      </TableBody>
      {showFooterRow && !loading && rows.length > 0 ? (
        <TableFooter className="sticky bottom-0 z-[1] bg-muted">
          <TableRow className="hover:bg-transparent">
            {reorderable ? (
              <TableCell
                className={cn('overflow-hidden bg-muted', hasLeftPins && 'sticky z-[4]')}
                style={leadingStickyStyle(hasLeftPins, 0, 4)}
              />
            ) : null}
            {selectable ? (
              <TableCell
                className={cn('overflow-hidden bg-muted', hasLeftPins && 'sticky z-[4]')}
                style={leadingStickyStyle(hasLeftPins, selectLeftOffset, 4)}
              />
            ) : null}
            {columns.map((col) => {
              const value = footerCells?.[col.key];
              const pinWidth = columnWidths[col.key] ?? (col.pin ? defaultColWidth : undefined);
              const pinStyle = pinStickyStyle(
                col.pin,
                leftOffsets[col.key],
                rightOffsets[col.key],
                pinWidth,
                { zIndex: 3 },
              );
              const edge = pinEdgeSide(columns, col);
              const display =
                value == null || value === ''
                  ? null
                  : col.aggregate === 'count'
                    ? `${value}`
                    : String(value);
              const announced =
                display != null && col.aggregate
                  ? `${col.header} ${aggregateLabel(col.aggregate)}: ${display}`
                  : display != null
                    ? `${col.header}: ${display}`
                    : undefined;
              return (
                <TableCell
                  key={`footer-${col.key}`}
                  className={cn(
                    'relative max-w-0 font-medium tabular-nums',
                    col.pin ? 'overflow-visible' : 'overflow-hidden',
                    stickyCellBg({ active: true, tone: 'footer' }),
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.pin && 'z-[3]',
                  )}
                  style={pinStyle}
                  aria-label={announced}
                >
                  {edge ? (
                    <PinEdgeShadow
                      side={edge}
                      visible={edge === 'left' ? pinScrollShadow.left : pinScrollShadow.right}
                    />
                  ) : null}
                  <div className="relative min-w-0 max-w-full overflow-hidden">
                    {display != null ? (
                      <span className="block truncate" title={display}>
                        {display}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
              );
            })}
            {actions.length > 0 ? (
              <TableCell
                className={cn('overflow-hidden bg-muted', hasRightPins && 'sticky z-[4]')}
                style={trailingStickyStyle(hasRightPins, 0, 4)}
              />
            ) : null}
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );

  const footerAggregateAnnouncement = showFooterRow
    ? columns
        .filter(
          (c) =>
            c.aggregate &&
            footerCells?.[c.key] != null &&
            footerCells[c.key] !== '',
        )
        .map(
          (c) =>
            `${c.header} ${aggregateLabel(c.aggregate)} ${footerCells![c.key]}`,
        )
        .join('; ')
    : '';

  const tableBlock = (
    <TooltipProvider delayDuration={400}>
      {footerAggregateAnnouncement ? (
        <div className="sr-only" aria-live="polite">
          Column aggregates: {footerAggregateAnnouncement}
        </div>
      ) : null}
      {reorderable ? (
        <DndContext
          id={`${tableId}-dnd`}
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          {tableInner}
        </DndContext>
      ) : (
        tableInner
      )}
    </TooltipProvider>
  );

  const footer = showPagination ? (
    <div className="grid grid-cols-1 gap-4 border-t bg-muted/30 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
      <p className="min-w-0 text-sm leading-normal text-muted-foreground whitespace-nowrap">
        {selectable
          ? `${selected.size} of ${totalRows} row(s) selected.`
          : `Showing ${totalRows === 0 ? 0 : (page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalRows)} of ${totalRows}`}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:justify-end">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${tableId}-rows`} className="text-sm font-medium whitespace-nowrap">
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm font-medium whitespace-nowrap tabular-nums">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="hidden size-8 sm:inline-flex"
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
              className="hidden size-8 sm:inline-flex"
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
    </div>
  ) : null;

  const panel = (
    <div className="overflow-clip rounded-lg border">
      {toolbar}
      {filterChipBar}
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
                        scheduleFilterEmit(next);
                      }}
                    />
                  ) : (
                    <div />
                  )}
                  <div className="ml-auto flex items-center gap-2">{exportMenu}</div>
                </div>
              )}
              {filterChipBar}
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
