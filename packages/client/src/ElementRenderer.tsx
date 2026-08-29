import { lazy, Suspense, useEffect, useRef, useState, Fragment, type CSSProperties, type ReactNode, type MouseEvent } from 'react';
import type { ElementNode } from './protocol';
import { BoundAppShell } from './AppShell';
import { elementReactKey } from './stickyShell';
import { chordList, formatChordDisplay, isEditableTarget, matchesChord } from './keybind';
import { BoundAreaChart } from './BoundAreaChart';
import { BoundBarChart } from './BoundBarChart';
import { BoundLineChart } from './BoundLineChart';
import { BoundPieChart } from './BoundPieChart';
import { BoundRadarChart } from './BoundRadarChart';
import { BoundRadialChart } from './BoundRadialChart';
import { BoundScatterChart } from './BoundScatterChart';
import { BoundComposedChart } from './BoundComposedChart';
import { BoundDataTable } from './BoundDataTable';
import { BoundCodeBlock } from './BoundCodeBlock';
import { BoundTree } from './BoundTree';
import { BoundEditor } from './BoundEditor';
import { BoundKanban } from './BoundKanban';
import { BoundRelativeTime } from './BoundRelativeTime';
import { BoundQrCode } from './BoundQrCode';
import { BoundImageZoom } from './BoundImageZoom';
import { BoundList } from './BoundList';
import { BoundImageCrop } from './BoundImageCrop';
import { BoundGantt } from './BoundGantt';
import { BoundFlow } from './BoundFlow';
import {
  BoundAiLoader,
  BoundAiThinking,
  BoundAiMessage,
  BoundAiPromptBar,
  BoundAiChat,
  BoundAiCodeBlock,
  BoundAiApproval,
  BoundAiToolChips,
  BoundAiTasks,
  BoundAiRecommendation,
  BoundAiContext,
  BoundAiDiffTable,
  BoundAiInsights,
  BoundAiSelectionActions,
  BoundAiFineTune,
} from './ai';
import { useOptimisticValue } from './useOptimisticValue';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/ui/field';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Slider } from '@/components/ui/slider';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { IconText, StatusDot } from './IconText';
import { CalendarIcon, ChevronDownIcon, ChevronLeft, ChevronRight, Star, TrendingDown, TrendingUp, Upload as UploadIcon, X } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { resolveNavIcon } from './shell/types';
import { MarkdownView } from './MarkdownView';

const KitchenSink = lazy(() => import('./KitchenSink'));

type Emit = (id: string, type: string, value?: unknown) => void;

const widthClass: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

function iconTextFromProps(
  props: Record<string, unknown>,
  opts: { iconSize?: 'xs' | 'sm' | 'default'; gap?: 1 | 2 | 3 } = {},
) {
  const gapRaw = props.gap;
  const gap =
    gapRaw === 1 || gapRaw === 2 || gapRaw === 3 ? (gapRaw as 1 | 2 | 3) : opts.gap;
  return {
    text: String(props.text ?? ''),
    icon: props.icon ? String(props.icon) : undefined,
    iconPosition: (props.iconPosition === 'end' ? 'end' : 'start') as 'start' | 'end',
    iconClassName: typeof props.iconClassName === 'string' ? props.iconClassName : undefined,
    iconSize: opts.iconSize,
    gap,
  };
}

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

function KeybindListener({
  id,
  props,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  emit: Emit;
}) {
  const keys = props.keys;
  const enabled = props.enabled !== false;
  const preventDefault = props.preventDefault !== false;
  const ignoreInput = props.ignoreInput !== false;
  const canPress = hasEvent(props, 'press');
  const keysKey = Array.isArray(keys) ? keys.join('\0') : String(keys ?? '');

  useEffect(() => {
    if (!enabled) return;

    const chords = chordList(keys);
    if (chords.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (ignoreInput && isEditableTarget(e.target)) return;
      if (!chords.some((chord) => matchesChord(e, chord))) return;
      if (preventDefault) e.preventDefault();
      if (canPress) emit(id, 'press');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [id, emit, enabled, preventDefault, ignoreInput, canPress, keys, keysKey]);

  return null;
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
  10: 'gap-10',
  12: 'gap-12',
};

function gapClass(gap: unknown): string {
  const n = typeof gap === 'number' ? gap : Number(gap);
  return gapMap[n] ?? 'gap-4';
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

function fieldError(props: Record<string, unknown>): string | undefined {
  const e = props.error;
  return typeof e === 'string' && e.length > 0 ? e : undefined;
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
  const error = fieldError(props);

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label htmlFor={`in-${id}`}>{String(props.label)}</Label> : null}
      <Input
        id={`in-${id}`}
        type={String(props.type ?? 'text')}
        value={value}
        placeholder={props.placeholder ? String(props.placeholder) : undefined}
        disabled={!!props.disabled}
        aria-invalid={!!error}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (hasEvent(props, 'input')) emit(id, 'input', next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
        }}
      />
      {error ? <FieldError>{error}</FieldError> : null}
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
  const error = fieldError(props);

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label htmlFor={`ta-${id}`}>{String(props.label)}</Label> : null}
      <Textarea
        id={`ta-${id}`}
        value={value}
        placeholder={props.placeholder ? String(props.placeholder) : undefined}
        disabled={!!props.disabled}
        rows={typeof props.rows === 'number' ? props.rows : undefined}
        aria-invalid={!!error}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (hasEvent(props, 'input')) emit(id, 'input', next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
        }}
      />
      {error ? <FieldError>{error}</FieldError> : null}
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
  const serverValue = String(props.value ?? '');
  const [value, setValue] = useOptimisticValue(serverValue);
  const options = (props.options as Array<{ value: string; label: string }>) ?? [];
  const error = fieldError(props);

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Select
        value={value || undefined}
        disabled={!!props.disabled}
        onValueChange={(next) => {
          setValue(next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
        }}
      >
        <SelectTrigger style={asStyle(style)} aria-invalid={!!error}>
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
      {error ? <FieldError>{error}</FieldError> : null}
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
  const serverValue = Number(props.value ?? props.min ?? 0);
  const [value, setValue] = useOptimisticValue(serverValue);
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = Number(props.step ?? 1);
  const error = fieldError(props);

  return (
    <div
      className={cn('flex w-full flex-col gap-2', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? (
        <div className="flex items-center justify-between gap-2">
          <Label>{String(props.label)}</Label>
          {props.showValue !== false ? (
            <span className="text-sm tabular-nums text-muted-foreground">{value}</span>
          ) : null}
        </div>
      ) : null}
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={!!props.disabled}
        aria-invalid={!!error}
        onValueChange={(vals) => {
          const n = vals[0] ?? min;
          setValue(n);
          if (hasEvent(props, 'change')) emit(id, 'change', n);
        }}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function BoundRating({
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
  const max = Math.max(1, Math.floor(Number(props.max ?? 5)));
  const serverValue = Math.min(max, Math.max(0, Number(props.value ?? 0)));
  const [value, setValue] = useOptimisticValue(serverValue);
  const [hover, setHover] = useState<number | null>(null);
  const error = fieldError(props);
  const disabled = !!props.disabled;
  const display = hover ?? value;

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? (
        <div className="flex items-center justify-between gap-2">
          <Label>{String(props.label)}</Label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {value}/{max}
          </span>
        </div>
      ) : null}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(null)}
        role="radiogroup"
        aria-label={props.label ? String(props.label) : 'Rating'}
      >
        {Array.from({ length: max }, (_, i) => {
          const n = i + 1;
          const filled = n <= display;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              disabled={disabled}
              className={cn(
                'rounded-sm p-0.5 text-amber-500 transition-colors disabled:opacity-50',
                !disabled && 'hover:scale-105',
              )}
              onMouseEnter={() => {
                if (!disabled) setHover(n);
              }}
              onClick={() => {
                const next = value === n ? 0 : n;
                setValue(next);
                if (hasEvent(props, 'change')) emit(id, 'change', next);
              }}
            >
              <Star className={cn('size-5', filled ? 'fill-current' : 'fill-transparent text-muted-foreground')} />
            </button>
          );
        })}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

const COLOR_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#0f172a',
  '#ffffff',
  '#f8fafc',
];

function normalizeHex(raw: string): string | null {
  const s = raw.trim();
  const withHash = s.startsWith('#') ? s : `#${s}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, a, b, c] = withHash;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return null;
}

function BoundColorPicker({
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
  const serverValue = String(props.value ?? '#3b82f6');
  const [value, setValue] = useOptimisticValue(serverValue);
  const [draft, setDraft] = useState(serverValue);
  const prevServer = useRef(serverValue);
  if (prevServer.current !== serverValue) {
    prevServer.current = serverValue;
    setDraft(serverValue);
  }
  const error = fieldError(props);
  const disabled = !!props.disabled;

  const commit = (next: string) => {
    const hex = normalizeHex(next) ?? next;
    setValue(hex);
    setDraft(hex);
    if (hasEvent(props, 'change')) emit(id, 'change', hex);
  };

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'inline-flex size-9 shrink-0 items-center justify-center rounded-md border shadow-xs disabled:opacity-50',
              )}
              style={{ backgroundColor: normalizeHex(value) ?? value }}
              aria-label="Open color picker"
            />
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-3" align="start">
            <div className="grid grid-cols-6 gap-1.5">
              {COLOR_SWATCHES.map((c, i) => (
                <button
                  key={`${c}-${i}`}
                  type="button"
                  className={cn(
                    'size-7 rounded-md border',
                    (normalizeHex(value) ?? value).toLowerCase() === c.toLowerCase() &&
                      'ring-2 ring-ring ring-offset-1',
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => commit(c)}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={normalizeHex(value) ?? '#000000'}
                disabled={disabled}
                className="h-9 w-12 cursor-pointer rounded border bg-transparent p-0.5"
                onChange={(e) => commit(e.target.value)}
              />
              <Input
                value={draft}
                disabled={disabled}
                placeholder="#000000"
                className="font-mono text-sm"
                onChange={(e) => {
                  setDraft(e.target.value);
                  const hex = normalizeHex(e.target.value);
                  if (hex) commit(hex);
                }}
                onBlur={() => {
                  const hex = normalizeHex(draft);
                  if (hex) commit(hex);
                  else setDraft(value);
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={draft}
          disabled={disabled}
          aria-invalid={!!error}
          className="font-mono text-sm"
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) commit(hex);
          }}
          onBlur={() => {
            const hex = normalizeHex(draft);
            if (hex) commit(hex);
            else setDraft(value);
          }}
        />
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function BoundTags({
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
  const serverValue = (Array.isArray(props.value) ? props.value : []) as string[];
  const [value, setValue] = useOptimisticValue(serverValue);
  const [text, setText] = useState('');
  const error = fieldError(props);
  const disabled = !!props.disabled;
  const creatable = props.creatable !== false;
  const options = (Array.isArray(props.options) ? props.options : []) as Array<{
    value: string;
    label: string;
  }>;
  const placeholder = String(props.placeholder ?? 'Add tag…');

  const commit = (next: string[]) => {
    setValue(next);
    if (hasEvent(props, 'change')) emit(id, 'change', next);
  };

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) {
      setText('');
      return;
    }
    const inOptions = options.some((o) => o.value === tag || o.label === tag);
    const resolved =
      options.find((o) => o.label === tag)?.value ??
      options.find((o) => o.value === tag)?.value ??
      tag;
    if (!creatable && !inOptions) {
      setText('');
      return;
    }
    if (value.includes(resolved)) {
      setText('');
      return;
    }
    commit([...value, resolved]);
    setText('');
  };

  const suggestions =
    text.trim().length > 0
      ? options.filter(
          (o) =>
            !value.includes(o.value) &&
            (o.label.toLowerCase().includes(text.toLowerCase()) ||
              o.value.toLowerCase().includes(text.toLowerCase())),
        )
      : [];

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5',
          disabled && 'opacity-50',
          error && 'border-destructive',
        )}
      >
        {value.map((tag) => {
          const label = options.find((o) => o.value === tag)?.label ?? tag;
          return (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {label}
              {!disabled ? (
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${label}`}
                  onClick={() => commit(value.filter((t) => t !== tag))}
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </Badge>
          );
        })}
        <input
          value={text}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[6rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag(text);
            } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
              commit(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (text.trim()) addTag(text);
          }}
        />
      </div>
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {suggestions.slice(0, 8).map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(o.value);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
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
  const serverValue = Boolean(props.checked ?? props.value ?? false);
  const [checked, setChecked] = useOptimisticValue(serverValue);
  const error = fieldError(props);

  return (
    <div
      className={cn('flex flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          id={`cb-${id}`}
          checked={checked}
          disabled={!!props.disabled}
          aria-invalid={!!error}
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
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function BoundSwitch({
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
  const serverValue = Boolean(props.checked ?? props.value ?? false);
  const [checked, setChecked] = useOptimisticValue(serverValue);
  const error = fieldError(props);

  return (
    <div
      className={cn('flex flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      <div className="flex items-center gap-2 text-sm">
        <Switch
          id={`sw-${id}`}
          checked={checked}
          disabled={!!props.disabled}
          size={props.size === 'sm' ? 'sm' : 'default'}
          aria-invalid={!!error}
          onCheckedChange={(next) => {
            setChecked(next);
            if (hasEvent(props, 'change')) emit(id, 'change', next);
            if (hasEvent(props, 'input')) emit(id, 'input', next);
          }}
        />
        {props.label ? (
          <Label htmlFor={`sw-${id}`} className="font-normal">
            {String(props.label)}
          </Label>
        ) : null}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function BoundTabs({
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
  children: ElementNode[];
}) {
  const panels = children.filter((c) => c.type === 'tab');
  const fallback = String(panels[0]?.props.value ?? '');
  const serverValue = String(props.value ?? '') || fallback;
  const [value, setValue] = useOptimisticValue(serverValue);
  const active = value || fallback;

  return (
    <Tabs
      value={active || undefined}
      onValueChange={(next) => {
        setValue(next);
        if (hasEvent(props, 'change')) emit(id, 'change', next);
        if (hasEvent(props, 'input')) emit(id, 'input', next);
      }}
      className={className}
      style={asStyle(style)}
    >
      <TabsList>
        {panels.map((panel) => {
          const panelValue = String(panel.props.value ?? '');
          const Icon = panel.props.icon ? resolveNavIcon(String(panel.props.icon)) : null;
          return (
            <TabsTrigger key={panel.id} value={panelValue} className="gap-1.5">
              {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
              {String(panel.props.label ?? panelValue)}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {panels.map((panel) => (
        <TabsContent key={panel.id} value={String(panel.props.value ?? '')} className={cn(panel.props.className as string | undefined)}>
          {panel.children.map((child) => (
            <ElementRenderer key={child.id} node={child} emit={emit} />
          ))}
        </TabsContent>
      ))}
    </Tabs>
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
      <DialogContent className={className} style={asStyle(style)}>
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

function clampStackIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), count - 1);
}

function BoundDialogStack({
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
  children: ElementNode[];
}) {
  const steps = children.filter((c) => c.type === 'dialogStackStep');
  const serverIndex = clampStackIndex(Number(props.index ?? 0), steps.length);
  const [index, setIndex] = useOptimisticValue(serverIndex);
  const active = clampStackIndex(index, steps.length);
  const open = !!props.open;
  const stackTitle = props.title != null ? String(props.title) : '';

  const goTo = (next: number) => {
    const clamped = clampStackIndex(next, steps.length);
    if (clamped === active) return;
    setIndex(clamped);
    if (hasEvent(props, 'indexChange')) emit(id, 'indexChange', clamped);
  };

  const activeStep = steps[active];
  const stepTitle =
    activeStep?.props.title != null ? String(activeStep.props.title) : '';
  const heading = stepTitle || stackTitle || 'Dialog';

  const renderStepBody = (step: ElementNode) =>
    step.children.map((child) => (
      <ElementRenderer key={child.id} node={child} emit={emit} />
    ));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && hasEvent(props, 'close')) emit(id, 'close');
      }}
    >
      <DialogPortal>
        <DialogOverlay />
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-slot="dialog-stack"
        >
          <div className="relative w-full max-w-lg" style={{ minHeight: '12rem' }}>
            {steps.map((step, i) => {
              const depth = active - i;
              if (depth < 0 || depth > 3) return null;
              const isActive = i === active;
              const stepClass = step.props.className as string | undefined;
              return (
                <div
                  key={step.id}
                  role={isActive ? 'dialog' : undefined}
                  aria-modal={isActive ? true : undefined}
                  aria-hidden={!isActive}
                  data-slot="dialog-stack-step"
                  data-active={isActive ? 'true' : undefined}
                  className={cn(
                    'grid w-full gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none transition-[transform,opacity] duration-200',
                    isActive
                      ? 'relative pointer-events-auto'
                      : 'absolute inset-x-0 top-0 pointer-events-none',
                    isActive ? className : undefined,
                    stepClass,
                  )}
                  style={{
                    ...(isActive ? asStyle(style) : undefined),
                    zIndex: i + 1,
                    transform: `translateY(${-depth * 14}px) scale(${1 - depth * 0.04})`,
                    opacity: depth === 0 ? 1 : Math.max(0.35, 1 - depth * 0.22),
                  }}
                >
                  {isActive ? (
                    <>
                      <div className="flex flex-col gap-1.5 pr-8 text-center sm:text-left">
                        <DialogTitle className="text-lg leading-none font-semibold">
                          {heading}
                        </DialogTitle>
                        {stackTitle && stepTitle && stackTitle !== stepTitle ? (
                          <DialogDescription className="text-sm text-muted-foreground">
                            {stackTitle}
                            {' · '}
                            Step {active + 1} of {steps.length}
                          </DialogDescription>
                        ) : steps.length > 1 ? (
                          <DialogDescription className="text-sm text-muted-foreground">
                            Step {active + 1} of {steps.length}
                          </DialogDescription>
                        ) : (
                          <DialogDescription className="sr-only">Dialog stack</DialogDescription>
                        )}
                      </div>

                      <div className="flex flex-col gap-4">{renderStepBody(step)}</div>

                      {steps.length > 1 ? (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={active <= 0}
                            onClick={() => goTo(active - 1)}
                          >
                            <ChevronLeft className="size-4" />
                            Back
                          </Button>
                          <div className="flex items-center gap-1.5">
                            {steps.map((s, dot) => (
                              <button
                                key={s.id}
                                type="button"
                                className={cn(
                                  'size-2 rounded-full transition-colors',
                                  dot === active
                                    ? 'bg-primary'
                                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                                )}
                                aria-label={`Go to step ${dot + 1}`}
                                onClick={() => goTo(dot)}
                              />
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={active >= steps.length - 1}
                            onClick={() => goTo(active + 1)}
                          >
                            Next
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden"
                        onClick={() => {
                          if (hasEvent(props, 'close')) emit(id, 'close');
                        }}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Close</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-1.5 text-center sm:text-left">
                      <div className="text-lg leading-none font-semibold">
                        {step.props.title != null ? String(step.props.title) : `Step ${i + 1}`}
                      </div>
                      <div className="h-16" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

function BoundAlertDialog({
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
  const open = !!props.open;
  const confirming = useRef(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (confirming.current) {
            confirming.current = false;
            return;
          }
          if (hasEvent(props, 'close')) emit(id, 'close');
        }
      }}
    >
      <AlertDialogContent className={className} style={asStyle(style)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{String(props.title ?? 'Confirm')}</AlertDialogTitle>
          {props.description ? (
            <AlertDialogDescription>{String(props.description)}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{String(props.cancelLabel ?? 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={(props.confirmVariant as any) ?? 'default'}
            onClick={() => {
              confirming.current = true;
              if (hasEvent(props, 'confirm')) emit(id, 'confirm');
            }}
          >
            {String(props.confirmLabel ?? 'OK')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BoundDropdownMenu({
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
  children: ElementNode[];
}) {
  void id;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={(props.variant as any) ?? 'outline'}
          className={className}
          style={asStyle(style)}
        >
          {String(props.label ?? 'Menu')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {children.map((child) => {
          if (child.type === 'dropdownseparator') {
            return <DropdownMenuSeparator key={child.id} />;
          }
          if (child.type !== 'dropdownitem') return null;
          return (
            <DropdownMenuItem
              key={child.id}
              variant={child.props.variant === 'destructive' ? 'destructive' : 'default'}
              disabled={!!child.props.disabled}
              onSelect={() => {
                if (hasEvent(child.props, 'select')) {
                  emit(child.id, 'select', child.props.value);
                }
              }}
            >
              {String(child.props.label ?? child.props.value ?? '')}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BoundContextMenu({
  props,
  className,
  style,
  emit,
  children,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
  children: ElementNode[];
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'inline-flex cursor-context-menu rounded-md border border-dashed px-3 py-2 text-sm',
            className,
          )}
          style={asStyle(style)}
        >
          {String(props.label ?? 'Right-click me')}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {children.map((child) => {
          if (child.type === 'contextmenuseparator') {
            return <ContextMenuSeparator key={child.id} />;
          }
          if (child.type !== 'contextmenuitem') return null;
          return (
            <ContextMenuItem
              key={child.id}
              variant={child.props.variant === 'destructive' ? 'destructive' : 'default'}
              disabled={!!child.props.disabled}
              onSelect={() => {
                if (hasEvent(child.props, 'select')) {
                  emit(child.id, 'select', child.props.value);
                }
              }}
            >
              {String(child.props.label ?? child.props.value ?? '')}
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function BoundHoverCard({
  props,
  className,
  style,
  children,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  children: ReactNode;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className={cn('inline-flex', className)} style={asStyle(style)}>
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent side={(props.side as 'top' | 'right' | 'bottom' | 'left') ?? 'top'}>
        <p className="text-sm">{String(props.text ?? '')}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

function BoundPopover({
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
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (hasEvent(props, 'openChange')) emit(id, 'openChange', next);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className={className} style={asStyle(style)}>
          {String(props.label ?? 'Open')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-3">{children}</PopoverContent>
    </Popover>
  );
}

function BoundInputOtp({
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
  const length = Math.max(1, Math.min(12, Number(props.length ?? 6)));
  const [value, setValue] = useOptimisticValue(String(props.value ?? ''));
  const disabled = !!props.disabled;

  return (
    <div className={cn('flex flex-col gap-1.5', className)} style={asStyle(style)}>
      <InputOTP
        maxLength={length}
        value={value}
        disabled={disabled}
        onChange={(next) => {
          setValue(next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
          if (next.length === length && hasEvent(props, 'complete')) {
            emit(id, 'complete', next);
          }
        }}
      >
        <InputOTPGroup>
          {Array.from({ length }, (_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

function BoundToggleGroup({
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
  children: ElementNode[];
}) {
  const type = props.type === 'multiple' ? 'multiple' : 'single';
  const serverValue = props.value;
  const [value, setValue] = useOptimisticValue(serverValue);
  const disabled = !!props.disabled;
  const items = children.filter((c) => c.type === 'toggleitem');

  return (
    <ToggleGroup
      type={type}
      variant={(props.variant as 'default' | 'outline') ?? 'default'}
      size={(props.size as 'default' | 'sm' | 'lg') ?? 'default'}
      value={
        type === 'multiple'
          ? (Array.isArray(value) ? value.map(String) : [])
          : String(value ?? '')
      }
      disabled={disabled}
      className={className}
      style={asStyle(style)}
      onValueChange={(next) => {
        setValue(next);
        if (hasEvent(props, 'change')) emit(id, 'change', next);
      }}
    >
      {items.map((child) => (
        <ToggleGroupItem
          key={child.id}
          value={String(child.props.value ?? '')}
          disabled={!!child.props.disabled || disabled}
        >
          {String(child.props.label ?? child.props.value ?? '')}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function renderMenubarChildren(
  children: ElementNode[],
  emit: Emit,
): ReactNode[] {
  return children.map((child) => {
    if (child.type === 'menubarseparator') {
      return <MenubarSeparator key={child.id} />;
    }
    if (child.type === 'menubarcheckbox') {
      return (
        <MenubarCheckboxItem
          key={child.id}
          checked={!!child.props.checked}
          disabled={!!child.props.disabled}
          onCheckedChange={(checked) => {
            if (hasEvent(child.props, 'checkedChange')) {
              emit(child.id, 'checkedChange', checked);
            }
          }}
        >
          {String(child.props.label ?? child.props.value ?? '')}
        </MenubarCheckboxItem>
      );
    }
    if (child.type === 'menubarradiogroup') {
      return (
        <MenubarRadioGroup
          key={child.id}
          value={child.props.value != null ? String(child.props.value) : undefined}
          onValueChange={(value) => {
            if (hasEvent(child.props, 'valueChange')) {
              emit(child.id, 'valueChange', value);
            }
          }}
        >
          {child.children
            .filter((item) => item.type === 'menubarradioitem')
            .map((item) => (
              <MenubarRadioItem
                key={item.id}
                value={String(item.props.value ?? '')}
                disabled={!!item.props.disabled}
              >
                {String(item.props.label ?? item.props.value ?? '')}
              </MenubarRadioItem>
            ))}
        </MenubarRadioGroup>
      );
    }
    if (child.type === 'menubarsubmenu') {
      return (
        <MenubarSub key={child.id}>
          <MenubarSubTrigger>{String(child.props.label ?? 'More')}</MenubarSubTrigger>
          <MenubarSubContent>{renderMenubarChildren(child.children, emit)}</MenubarSubContent>
        </MenubarSub>
      );
    }
    if (child.type !== 'menubaritem') return null;
    return (
      <MenubarItem
        key={child.id}
        variant={child.props.variant === 'destructive' ? 'destructive' : 'default'}
        disabled={!!child.props.disabled}
        onSelect={() => {
          if (hasEvent(child.props, 'select')) {
            emit(child.id, 'select', child.props.value);
          }
        }}
      >
        {String(child.props.label ?? child.props.value ?? '')}
      </MenubarItem>
    );
  });
}

function BoundMenubar({
  props,
  className,
  style,
  emit,
  children,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
  children: ElementNode[];
}) {
  void props;
  return (
    <Menubar className={className} style={asStyle(style)}>
      {children
        .filter((c) => c.type === 'menubarmenu')
        .map((menu) => (
          <MenubarMenu key={menu.id}>
            <MenubarTrigger>{String(menu.props.label ?? 'Menu')}</MenubarTrigger>
            <MenubarContent>{renderMenubarChildren(menu.children, emit)}</MenubarContent>
          </MenubarMenu>
        ))}
    </Menubar>
  );
}

function BoundCarousel({
  props,
  className,
  style,
  children,
  renderChild,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  children: ElementNode[];
  renderChild: (node: ElementNode) => ReactNode;
}) {
  const slides = children.filter((c) => c.type === 'carouselslide');
  const showControls = props.controls !== false;
  return (
    <Carousel
      orientation={props.orientation === 'vertical' ? 'vertical' : 'horizontal'}
      className={cn('w-full max-w-sm', className)}
      style={asStyle(style)}
    >
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.id}>
            <div className="flex min-h-24 items-center justify-center rounded-md border p-4">
              {slide.children.map((child) => (
                <Fragment key={child.id}>{renderChild(child)}</Fragment>
              ))}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {showControls ? (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      ) : null}
    </Carousel>
  );
}

function BoundCommand({
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
  children: ElementNode[];
}) {
  const inline = props.mode === 'inline';
  const open = inline ? true : !!props.open;

  const body = (
    <>
      <CommandInput placeholder={String(props.placeholder ?? 'Type a command or search…')} />
      <CommandList style={asStyle(style)}>
        <CommandEmpty>{String(props.emptyText ?? 'No results found.')}</CommandEmpty>
        {children.map((child) => {
          if (child.type === 'commandseparator') {
            return <CommandSeparator key={child.id} />;
          }
          if (child.type !== 'commandgroup') return null;
          return (
            <CommandGroup key={child.id} heading={String(child.props.heading ?? '')}>
              {child.children
                .filter((item) => item.type === 'commanditem')
                .map((item) => (
                  <CommandItem
                    key={item.id}
                    value={String(item.props.value ?? item.props.label ?? '')}
                    disabled={!!item.props.disabled}
                    onSelect={() => {
                      if (hasEvent(item.props, 'select')) {
                        emit(item.id, 'select', item.props.value);
                      }
                      if (!inline && hasEvent(props, 'openChange')) {
                        emit(id, 'openChange', false);
                      }
                    }}
                  >
                    <span>{String(item.props.label ?? item.props.value ?? '')}</span>
                    {item.props.shortcut ? (
                      <CommandShortcut>{String(item.props.shortcut)}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </>
  );

  if (inline) {
    return (
      <Command
        className={cn(
          'rounded-md border shadow-sm **:data-[slot=command-input-wrapper]:h-10',
          className,
        )}
      >
        {body}
      </Command>
    );
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (hasEvent(props, 'openChange')) emit(id, 'openChange', next);
      }}
      title={String(props.title ?? 'Command Palette')}
      description={String(props.description ?? 'Search for a command to run…')}
      className={className}
    >
      {body}
    </CommandDialog>
  );
}

function BoundResizable({
  props,
  className,
  style,
  children,
  renderChild,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  children: ElementNode[];
  renderChild: (node: ElementNode) => ReactNode;
}) {
  return (
    <ResizablePanelGroup
      orientation={props.orientation === 'vertical' ? 'vertical' : 'horizontal'}
      className={cn('min-h-40 rounded-md border', className)}
      style={asStyle(style)}
    >
      {children.map((child) => {
        if (child.type === 'resizablehandle') {
          return (
            <ResizableHandle
              key={child.id}
              withHandle={child.props.withHandle !== false}
              className={typeof child.props.className === 'string' ? child.props.className : undefined}
            />
          );
        }
        if (child.type !== 'resizablepanel') return null;
        return (
          <ResizablePanel
            key={child.id}
            defaultSize={
              typeof child.props.defaultSize === 'number'
                ? String(child.props.defaultSize)
                : typeof child.props.defaultSize === 'string'
                  ? child.props.defaultSize
                  : undefined
            }
            minSize={
              typeof child.props.minSize === 'number'
                ? String(child.props.minSize)
                : typeof child.props.minSize === 'string'
                  ? child.props.minSize
                  : undefined
            }
            maxSize={
              typeof child.props.maxSize === 'number'
                ? String(child.props.maxSize)
                : typeof child.props.maxSize === 'string'
                  ? child.props.maxSize
                  : undefined
            }
            className={cn(
              'p-3',
              typeof child.props.className === 'string' ? child.props.className : undefined,
            )}
          >
            {child.children.map((c) => (
              <Fragment key={c.id}>{renderChild(c)}</Fragment>
            ))}
          </ResizablePanel>
        );
      })}
    </ResizablePanelGroup>
  );
}

function BoundScrollArea({
  id,
  props,
  className,
  style,
  children,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  children: ReactNode;
  emit: Emit;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const armedRef = useRef(true);
  const canNearEnd = hasEvent(props, 'nearEnd');
  const threshold =
    typeof props.nearEndThreshold === 'number' && Number.isFinite(props.nearEndThreshold)
      ? Math.max(0, props.nearEndThreshold)
      : 80;

  useEffect(() => {
    if (!canNearEnd) return;
    const root = rootRef.current;
    if (!root) return;
    const viewport = root.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null;
    if (!viewport) return;

    const onScroll = () => {
      const remaining = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const near = remaining <= threshold;
      if (near) {
        if (armedRef.current) {
          armedRef.current = false;
          emit(id, 'nearEnd');
        }
      } else {
        armedRef.current = true;
      }
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => viewport.removeEventListener('scroll', onScroll);
  }, [id, emit, canNearEnd, threshold, children]);

  return (
    <div ref={rootRef} className="contents">
      <ScrollArea className={cn('h-32 w-full rounded-md border', className)} style={asStyle(style)}>
        <div className="p-3">{children}</div>
      </ScrollArea>
    </div>
  );
}

function BoundViewportEnter({
  id,
  props,
  className,
  style,
  children,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  children: ReactNode;
  emit: Emit;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const canEnter = hasEvent(props, 'enter');
  const once = props.once !== false;
  const rootMargin = typeof props.rootMargin === 'string' ? props.rootMargin : '0px';
  const thresholdProp = props.threshold;
  const thresholdKey = Array.isArray(thresholdProp)
    ? thresholdProp.join(',')
    : String(thresholdProp ?? 0);

  useEffect(() => {
    if (!canEnter) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    firedRef.current = false;
    const threshold = Array.isArray(thresholdProp)
      ? thresholdProp.map(Number)
      : typeof thresholdProp === 'number'
        ? thresholdProp
        : 0;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (once && firedRef.current) continue;
            firedRef.current = true;
            emit(id, 'enter');
            if (once) {
              observer.disconnect();
              return;
            }
          } else if (!once) {
            firedRef.current = false;
          }
        }
      },
      { root: null, rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [id, emit, canEnter, once, rootMargin, thresholdKey, thresholdProp]);

  return (
    <div ref={ref} className={cn(className)} style={asStyle(style)}>
      {children}
    </div>
  );
}

function BoundBreadcrumb({
  props,
  className,
  style,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
}) {
  const items = (props.items as Array<{ label: string; href?: string }>) ?? [];
  return (
    <Breadcrumb className={className} style={asStyle(style)}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const href = item.href;
          const showLink = !!href && !isLast;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {showLink ? (
                  <BreadcrumbLink
                    href={href}
                    onClick={(e) => {
                      if (href.startsWith('/')) {
                        e.preventDefault();
                        window.history.pushState({}, '', href);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                  >
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BoundRadioGroup({
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
  const options = (props.options as Array<{ value: string; label: string }>) ?? [];
  const horizontal = props.orientation === 'horizontal';
  const error = fieldError(props);

  return (
    <div
      className={cn('flex w-full flex-col gap-2', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <RadioGroup
        value={value || undefined}
        disabled={!!props.disabled}
        aria-invalid={!!error}
        onValueChange={(next) => {
          setValue(next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
          if (hasEvent(props, 'input')) emit(id, 'input', next);
        }}
        className={cn(horizontal ? 'flex flex-wrap gap-4' : 'grid gap-3')}
      >
        {options.map((opt) => {
          const optId = `rg-${id}-${opt.value}`;
          return (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={optId} />
              <Label htmlFor={optId} className="font-normal">
                {opt.label}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

type ComboboxOption = { value: string; label: string };

function BoundCombobox({
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
  const options = (props.options as ComboboxOption[]) ?? [];
  const selected = options.find((opt) => opt.value === value) ?? null;
  const error = fieldError(props);

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Combobox
        items={options}
        value={selected}
        disabled={!!props.disabled}
        onValueChange={(next) => {
          const nextValue = next?.value ?? '';
          setValue(nextValue);
          if (hasEvent(props, 'change')) emit(id, 'change', nextValue);
          if (hasEvent(props, 'input')) emit(id, 'input', nextValue);
        }}
      >
        <ComboboxInput
          placeholder={String(props.placeholder ?? 'Search…')}
          disabled={!!props.disabled}
          showClear={!!selected}
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxEmpty>No results.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function parseDateValue(raw: string): Date | undefined {
  if (!raw) return undefined;
  try {
    const d = parseISO(raw.length === 10 ? `${raw}T00:00:00` : raw);
    return isValid(d) ? d : undefined;
  } catch {
    return undefined;
  }
}

function BoundDate({
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
  const selected = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const error = fieldError(props);

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5', className)}
      style={asStyle(style)}
      data-invalid={error ? true : undefined}
    >
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`date-${id}`}
            variant="outline"
            disabled={!!props.disabled}
            aria-invalid={!!error}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selected && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {selected ? format(selected, 'PPP') : String(props.placeholder ?? 'Pick a date')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => {
              const next = day ? format(day, 'yyyy-MM-dd') : '';
              setValue(next);
              setOpen(false);
              if (hasEvent(props, 'change')) emit(id, 'change', next);
              if (hasEvent(props, 'input')) emit(id, 'input', next);
            }}
          />
        </PopoverContent>
      </Popover>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function BoundAccordion({
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
  children: ElementNode[];
}) {
  const panels = children.filter((c) => c.type === 'accordionitem');
  const type = props.type === 'multiple' ? 'multiple' : 'single';
  const fallback = String(panels[0]?.props.value ?? '');
  const serverValue =
    type === 'multiple'
      ? Array.isArray(props.value)
        ? (props.value as string[])
        : props.value
          ? [String(props.value)]
          : []
      : String(props.value ?? '') || fallback;
  const [value, setValue] = useOptimisticValue(serverValue);

  const onValueChange = (next: string | string[]) => {
    setValue(next);
    if (hasEvent(props, 'change')) emit(id, 'change', next);
    if (hasEvent(props, 'input')) emit(id, 'input', next);
  };

  const items = panels.map((panel) => (
    <AccordionItem
      key={panel.id}
      value={String(panel.props.value ?? '')}
      className={cn(panel.props.className as string | undefined)}
    >
      <AccordionTrigger>{String(panel.props.title ?? panel.props.value ?? '')}</AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2">
          {panel.children.map((child) => (
            <ElementRenderer key={child.id} node={child} emit={emit} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  ));

  if (type === 'multiple') {
    return (
      <Accordion
        type="multiple"
        value={Array.isArray(value) ? value : []}
        onValueChange={onValueChange}
        className={className}
        style={asStyle(style)}
      >
        {items}
      </Accordion>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible={props.collapsible !== false}
      value={(typeof value === 'string' ? value : '') || undefined}
      onValueChange={onValueChange}
      className={className}
      style={asStyle(style)}
    >
      {items}
    </Accordion>
  );
}

function BoundCollapsible({
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
  const serverOpen = Boolean(props.open ?? props.value ?? false);
  const [open, setOpen] = useOptimisticValue(serverOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (hasEvent(props, 'change')) emit(id, 'change', next);
        if (hasEvent(props, 'input')) emit(id, 'input', next);
      }}
      className={cn('w-full', className)}
      style={asStyle(style)}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full items-center justify-between gap-2 px-0">
          <span>{String(props.title ?? 'Toggle')}</span>
          <ChevronDownIcon
            className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2 pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function BoundSheet({
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
  const side =
    props.side === 'top' || props.side === 'bottom' || props.side === 'left' || props.side === 'right'
      ? props.side
      : 'right';

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && hasEvent(props, 'close')) emit(id, 'close');
      }}
    >
      <SheetContent side={side} className={className} style={asStyle(style)}>
        {props.title || props.description ? (
          <SheetHeader>
            {props.title ? <SheetTitle>{String(props.title)}</SheetTitle> : null}
            {props.description ? (
              <SheetDescription>{String(props.description)}</SheetDescription>
            ) : null}
          </SheetHeader>
        ) : (
          <SheetTitle className="sr-only">Sheet</SheetTitle>
        )}
        <div className="flex flex-col gap-4 px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

function BoundDrawer({
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
  const direction =
    props.direction === 'top' ||
    props.direction === 'bottom' ||
    props.direction === 'left' ||
    props.direction === 'right'
      ? props.direction
      : 'bottom';

  return (
    <Drawer
      open={open}
      direction={direction}
      onOpenChange={(next) => {
        if (!next && hasEvent(props, 'close')) emit(id, 'close');
      }}
    >
      <DrawerContent className={className} style={asStyle(style)}>
        {props.title || props.description ? (
          <DrawerHeader>
            {props.title ? <DrawerTitle>{String(props.title)}</DrawerTitle> : null}
            {props.description ? (
              <DrawerDescription>{String(props.description)}</DrawerDescription>
            ) : null}
          </DrawerHeader>
        ) : (
          <DrawerTitle className="sr-only">Drawer</DrawerTitle>
        )}
        <div className="flex flex-col gap-4 px-4 pb-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

function BoundUpload({
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
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const label = String(props.label ?? 'Upload');
  const accept = props.accept ? String(props.accept) : undefined;
  const multiple = !!props.multiple;
  const abortable = props.abortable !== false;
  const variant = props.variant === 'dropzone' ? 'dropzone' : 'button';
  const maxSizeBytes =
    typeof props.maxSizeBytes === 'number' && props.maxSizeBytes > 0
      ? props.maxSizeBytes
      : undefined;
  const disabled = !!props.disabled || busy;

  const matchesAcceptToken = (file: File): boolean => {
    if (!accept?.trim()) return true;
    const tokens = accept
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return tokens.some((token) => {
      if (token.startsWith('.')) return name.endsWith(token);
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
  };

  const abortUpload = () => {
    xhrRef.current?.abort();
  };

  const startUpload = (files: File[]) => {
    if (!files.length) return;

    for (const file of files) {
      if (maxSizeBytes != null && file.size > maxSizeBytes) {
        const msg = `File "${file.name}" is ${file.size} bytes; max allowed is ${maxSizeBytes} bytes`;
        setError(msg);
        if (hasEvent(props, 'error')) emit(id, 'error', msg);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      if (!matchesAcceptToken(file)) {
        const msg =
          `File "${file.name}" (${file.type || 'unknown type'}) is not an allowed type` +
          (accept ? ` (accept: ${accept})` : '');
        setError(msg);
        if (hasEvent(props, 'error')) emit(id, 'error', msg);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
    }

    setBusy(true);
    setError(null);
    setProgress(0);
    const fd = new FormData();
    for (const file of files) {
      fd.append('files', file);
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', '/upload');
    xhr.responseType = 'json';
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const percent = Math.round((ev.loaded / ev.total) * 100);
      setProgress(percent);
      if (hasEvent(props, 'progress')) {
        emit(id, 'progress', { percent, loaded: ev.loaded, total: ev.total });
      }
    };
    xhr.onload = () => {
      xhrRef.current = null;
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
      const data = (xhr.response ?? {}) as {
        files?: Array<{ name: string; size: number; type: string; path: string }>;
        error?: string;
      };
      if (xhr.status < 200 || xhr.status >= 300) {
        const msg = data.error || `Upload failed (${xhr.status})`;
        setError(msg);
        if (hasEvent(props, 'error')) emit(id, 'error', msg);
        return;
      }
      for (const file of data.files ?? []) {
        if (hasEvent(props, 'upload')) emit(id, 'upload', file);
      }
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
      const msg = 'Upload failed (network error)';
      setError(msg);
      if (hasEvent(props, 'error')) emit(id, 'error', msg);
    };
    xhr.onabort = () => {
      xhrRef.current = null;
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
      if (hasEvent(props, 'abort')) emit(id, 'abort');
    };
    xhr.send(fd);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      className="sr-only"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      onChange={(e) => {
        const list = e.target.files;
        if (!list?.length) return;
        startUpload(Array.from(list));
      }}
    />
  );

  const progressUi =
    busy && progress != null ? (
      <Progress value={progress} className="h-1.5 w-full max-w-xs" />
    ) : null;

  const abortUi =
    busy && abortable ? (
      <Button type="button" variant="ghost" size="sm" onClick={abortUpload}>
        Cancel
      </Button>
    ) : null;

  if (variant === 'dropzone') {
    return (
      <div className={cn('flex flex-col gap-1.5', className)} style={asStyle(style)}>
        {fileInput}
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors',
            dragOver && !disabled
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (disabled) return;
            const list = e.dataTransfer.files;
            if (!list?.length) return;
            startUpload(Array.from(list));
          }}
        >
          <UploadIcon className="size-8 text-muted-foreground" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {busy
                ? progress != null
                  ? `Uploading… ${progress}%`
                  : 'Uploading…'
                : dragOver
                  ? 'Drop files here'
                  : label}
            </p>
            {!busy ? (
              <p className="text-xs text-muted-foreground">
                Drag and drop, or click to browse
                {accept ? ` · ${accept}` : ''}
              </p>
            ) : null}
          </div>
          {abortUi}
        </button>
        {progressUi}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)} style={asStyle(style)}>
      {fileInput}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {busy
            ? progress != null
              ? `Uploading… ${progress}%`
              : 'Uploading…'
            : label}
        </Button>
        {abortUi}
      </div>
      {progressUi}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function ElementRenderer({ node, emit }: { node: ElementNode; emit: Emit }) {
  const { id, type, props, children } = node;
  const className = props.className as string | undefined;
  const style = props.style;

  const renderChildren = () =>
    children.map((child) => (
      <ElementRenderer key={elementReactKey(child)} node={child} emit={emit} />
    ));

  switch (type) {
    case 'root':
      return <div className="min-h-screen">{renderChildren()}</div>;

    case 'app': {
      const title = String(props.title ?? '');
      const headerTitle = String(props.headerTitle ?? '');
      const collapsible = (props.collapsible as 'offcanvas' | 'icon' | 'none') ?? 'icon';
      const variant = (props.variant as 'sidebar' | 'inset' | 'floating') ?? 'inset';
      const nav = (Array.isArray(props.nav) ? props.nav : []) as Array<{
        label: string;
        href: string;
        icon?: string;
        description?: string;
        active?: boolean;
      }>;
      const navSecondary = (Array.isArray(props.navSecondary) ? props.navSecondary : []) as typeof nav;
      const documents = (Array.isArray(props.documents) ? props.documents : []) as typeof nav;
      const primaryAction =
        props.primaryAction && typeof props.primaryAction === 'object'
          ? (props.primaryAction as { label: string; href?: string; icon?: string })
          : null;
      const user =
        props.user && typeof props.user === 'object'
          ? (props.user as { name: string; email: string; avatar?: string })
          : null;

      return (
        <BoundAppShell
          title={title}
          headerTitle={headerTitle}
          collapsible={collapsible}
          variant={variant}
          user={user}
          nav={nav}
          navSecondary={navSecondary}
          documents={documents}
          primaryAction={primaryAction}
          className={className}
          style={asStyle(style)}
        >
          {renderChildren()}
        </BoundAppShell>
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
          {props.title || props.description ? (
            <CardHeader>
              {props.title ? <CardTitle>{String(props.title)}</CardTitle> : null}
              {props.description ? (
                <CardDescription>{String(props.description)}</CardDescription>
              ) : null}
            </CardHeader>
          ) : null}
          <CardContent className={cn('flex flex-col', gapClass(props.gap))}>
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

    case 'dialogStack':
      return (
        <BoundDialogStack
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
        />
      );

    case 'dialogStackStep':
      return null;

    case 'alertdialog':
      return (
        <BoundAlertDialog id={id} props={props} className={className} style={style} emit={emit} />
      );

    case 'dropdownmenu':
      return (
        <BoundDropdownMenu
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
        />
      );

    case 'contextmenu':
      return (
        <BoundContextMenu
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
        />
      );

    case 'breadcrumb':
      return <BoundBreadcrumb props={props} className={className} style={style} />;

    case 'sheet':
      return (
        <BoundSheet id={id} props={props} className={className} style={style} emit={emit}>
          {renderChildren()}
        </BoundSheet>
      );

    case 'drawer':
      return (
        <BoundDrawer id={id} props={props} className={className} style={style} emit={emit}>
          {renderChildren()}
        </BoundDrawer>
      );

    case 'label':
      return (
        <IconText
          {...iconTextFromProps(props)}
          as="div"
          className={cn('text-base', className)}
          style={asStyle(style)}
        />
      );

    case 'iconText':
      return (
        <IconText
          {...iconTextFromProps(props)}
          className={className}
          style={asStyle(style)}
        />
      );

    case 'statusDot':
      return (
        <StatusDot
          text={String(props.text ?? '')}
          color={typeof props.color === 'string' ? props.color : undefined}
          icon={typeof props.icon === 'string' ? props.icon : undefined}
          className={className}
          style={asStyle(style)}
        />
      );

    case 'button': {
      const slot = iconTextFromProps(props);
      const iconOnly = !!slot.icon && !slot.text;
      return (
        <Button
          variant={(props.variant as any) ?? 'default'}
          size={(props.size as any) ?? 'default'}
          disabled={!!props.disabled}
          className={className}
          style={asStyle(style)}
          aria-label={iconOnly ? String(props.icon) : undefined}
          onClick={() => {
            if (hasEvent(props, 'click')) emit(id, 'click');
          }}
        >
          <IconText {...slot} gap={2} iconSize="default" />
        </Button>
      );
    }

    case 'input':
      return <BoundInput id={id} props={props} className={className} style={style} emit={emit} />;

    case 'textarea':
      return <BoundTextarea id={id} props={props} className={className} style={style} emit={emit} />;

    case 'checkbox':
      return <BoundCheckbox id={id} props={props} className={className} style={style} emit={emit} />;

    case 'switch':
      return <BoundSwitch id={id} props={props} className={className} style={style} emit={emit} />;

    case 'select':
      return <BoundSelect id={id} props={props} className={className} style={style} emit={emit} />;

    case 'radiogroup':
      return <BoundRadioGroup id={id} props={props} className={className} style={style} emit={emit} />;

    case 'combobox':
      return <BoundCombobox id={id} props={props} className={className} style={style} emit={emit} />;

    case 'date':
      return <BoundDate id={id} props={props} className={className} style={style} emit={emit} />;

    case 'slider':
      return <BoundSlider id={id} props={props} className={className} style={style} emit={emit} />;

    case 'rating':
      return <BoundRating id={id} props={props} className={className} style={style} emit={emit} />;

    case 'colorPicker':
      return <BoundColorPicker id={id} props={props} className={className} style={style} emit={emit} />;

    case 'tags':
      return <BoundTags id={id} props={props} className={className} style={style} emit={emit} />;

    case 'codeBlock':
      return <BoundCodeBlock id={id} props={props} className={className} style={style} emit={emit} />;

    case 'tree':
      return <BoundTree id={id} props={props} className={className} style={style} emit={emit} />;

    case 'editor':
      return <BoundEditor id={id} props={props} className={className} style={style} emit={emit} />;

    case 'kanban':
      return (
        <BoundKanban
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          renderNode={(child, childEmit) => <ElementRenderer node={child} emit={childEmit} />}
        />
      );

    case 'relativeTime':
      return (
        <BoundRelativeTime id={id} props={props} className={className} style={style} emit={emit} />
      );

    case 'qrCode':
      return <BoundQrCode id={id} props={props} className={className} style={style} emit={emit} />;

    case 'imageZoom':
      return <BoundImageZoom id={id} props={props} className={className} style={style} emit={emit} />;

    case 'list':
      return <BoundList id={id} props={props} className={className} style={style} emit={emit} />;

    case 'imageCrop':
      return <BoundImageCrop id={id} props={props} className={className} style={style} emit={emit} />;

    case 'gantt':
      return <BoundGantt id={id} props={props} className={className} style={style} emit={emit} />;

    case 'flow':
      return (
        <BoundFlow
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
          renderNode={(child, childEmit) => <ElementRenderer node={child} emit={childEmit} />}
        />
      );

    case 'flowNode':
      return null;

    case 'aiLoader':
      return <BoundAiLoader id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiThinking':
      return <BoundAiThinking id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiMessage':
      return <BoundAiMessage id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiPromptBar':
      return <BoundAiPromptBar id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiChat':
      return <BoundAiChat id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiCodeBlock':
      return <BoundAiCodeBlock id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiApproval':
      return <BoundAiApproval id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiToolChips':
      return <BoundAiToolChips id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiTasks':
      return <BoundAiTasks id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiRecommendation':
      return (
        <BoundAiRecommendation id={id} props={props} className={className} style={style} emit={emit} />
      );

    case 'aiContext':
      return <BoundAiContext id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiDiffTable':
      return <BoundAiDiffTable id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiInsights':
      return <BoundAiInsights id={id} props={props} className={className} style={style} emit={emit} />;

    case 'aiSelectionActions':
      return (
        <BoundAiSelectionActions id={id} props={props} className={className} style={style} emit={emit} />
      );

    case 'aiFineTune':
      return <BoundAiFineTune id={id} props={props} className={className} style={style} emit={emit} />;

    case 'link': {
      const href = String(props.href ?? '#');
      const external = !!props.external || /^https?:\/\//i.test(href);
      return (
        <a
          href={href}
          className={cn('text-primary underline-offset-4 hover:underline', className)}
          style={asStyle(style)}
          {...(external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {
                onClick: (e: MouseEvent) => {
                  if (href.startsWith('/')) {
                    e.preventDefault();
                    window.history.pushState({}, '', href);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                },
              })}
        >
          <IconText {...iconTextFromProps(props)} gap={2} iconSize="sm" />
        </a>
      );
    }

    case 'badge':
      return (
        <Badge
          variant={(props.variant as any) ?? 'default'}
          size={props.size === 'xs' ? 'xs' : 'default'}
          color={typeof props.color === 'string' ? props.color : undefined}
          className={className}
          style={asStyle(style)}
        >
          <IconText
            {...iconTextFromProps(props, { iconSize: props.size === 'xs' ? 'xs' : 'sm' })}
            gap={1}
          />
        </Badge>
      );

    case 'alert':
      return (
        <Alert
          variant={props.variant === 'destructive' ? 'destructive' : 'default'}
          className={className}
          style={asStyle(style)}
        >
          <AlertDescription>
            <IconText {...iconTextFromProps(props)} gap={2} iconSize="default" />
          </AlertDescription>
        </Alert>
      );

    case 'spinner':
      return <Spinner className={className} style={asStyle(style)} />;

    case 'skeleton':
      return <Skeleton className={className} style={asStyle(style)} />;

    case 'avatar': {
      const size =
        props.size === 'sm' || props.size === 'lg' ? props.size : 'default';
      const fallback = String(props.fallback ?? '?');
      return (
        <Avatar size={size} className={className} style={asStyle(style)}>
          {props.src ? (
            <AvatarImage src={String(props.src)} alt={String(props.alt ?? '')} />
          ) : null}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      );
    }

    case 'progress':
      return (
        <Progress
          value={typeof props.value === 'number' ? props.value : Number(props.value) || 0}
          className={className}
          style={asStyle(style)}
        />
      );

    case 'separator':
      return (
        <Separator
          orientation={props.orientation === 'vertical' ? 'vertical' : 'horizontal'}
          className={className}
          style={asStyle(style)}
        />
      );

    case 'icon': {
      const Icon = resolveNavIcon(typeof props.name === 'string' ? props.name : undefined);
      return <Icon className={cn('size-4', className)} style={asStyle(style)} aria-hidden />;
    }

    case 'markdown':
      return (
        <MarkdownView
          text={String(props.text ?? '')}
          className={className}
          style={asStyle(style)}
        />
      );

    case 'html':
      return (
        <div
          className={cn('clay-html', className)}
          style={asStyle(style)}
          dangerouslySetInnerHTML={{ __html: String(props.html ?? '') }}
        />
      );

    case 'image':
      return (
        <img
          src={String(props.src ?? '')}
          alt={String(props.alt ?? '')}
          width={props.width as number | string | undefined}
          height={props.height as number | string | undefined}
          className={cn('max-w-full h-auto', className)}
          style={asStyle(style)}
        />
      );

    case 'iframe':
      return (
        <iframe
          src={String(props.src ?? '')}
          title={String(props.title ?? '')}
          width={props.width as number | string | undefined}
          height={props.height as number | string | undefined}
          allow={typeof props.allow === 'string' ? props.allow : undefined}
          sandbox={typeof props.sandbox === 'string' ? props.sandbox : undefined}
          loading={props.loading === 'eager' || props.loading === 'lazy' ? props.loading : undefined}
          referrerPolicy={
            typeof props.referrerPolicy === 'string' ? props.referrerPolicy : undefined
          }
          className={cn('w-full border-0 rounded-md bg-muted/30', className)}
          style={asStyle(style)}
        />
      );

    case 'tabs':
      return (
        <BoundTabs id={id} props={props} className={className} style={style} emit={emit} children={children} />
      );

    case 'accordion':
      return (
        <BoundAccordion
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
        />
      );

    case 'collapsible':
      return (
        <BoundCollapsible id={id} props={props} className={className} style={style} emit={emit}>
          {renderChildren()}
        </BoundCollapsible>
      );

    case 'tooltip':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('inline-flex', className)} style={asStyle(style)}>
                {renderChildren()}
              </span>
            </TooltipTrigger>
            <TooltipContent side={(props.side as 'top' | 'right' | 'bottom' | 'left') ?? 'top'}>
              {String(props.text ?? '')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

    case 'hovercard':
      return (
        <BoundHoverCard props={props} className={className} style={style}>
          {renderChildren()}
        </BoundHoverCard>
      );

    case 'popover':
      return (
        <BoundPopover id={id} props={props} className={className} style={style} emit={emit}>
          {renderChildren()}
        </BoundPopover>
      );

    case 'inputotp':
      return <BoundInputOtp id={id} props={props} className={className} style={style} emit={emit} />;

    case 'togglegroup':
      return (
        <BoundToggleGroup
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
        />
      );

    case 'menubar':
      return (
        <BoundMenubar
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
        />
      );

    case 'carousel':
      return (
        <BoundCarousel
          props={props}
          className={className}
          style={style}
          children={children}
          renderChild={(child) => <ElementRenderer node={child} emit={emit} />}
        />
      );

    case 'command':
      return (
        <BoundCommand
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          children={children}
        />
      );

    case 'resizable':
      return (
        <BoundResizable
          props={props}
          className={className}
          style={style}
          children={children}
          renderChild={(child) => <ElementRenderer node={child} emit={emit} />}
        />
      );

    case 'scrollarea':
      return (
        <BoundScrollArea id={id} props={props} className={className} style={style} emit={emit}>
          {renderChildren()}
        </BoundScrollArea>
      );

    case 'viewportEnter':
      return (
        <BoundViewportEnter id={id} props={props} className={className} style={style} emit={emit}>
          {renderChildren()}
        </BoundViewportEnter>
      );

    case 'keybind':
      return <KeybindListener id={id} props={props} emit={emit} />;

    case 'kbd': {
      const chords = formatChordDisplay(props.keys as string | string[]);
      if (chords.length === 0) return null;
      return (
        <KbdGroup className={className} style={asStyle(style)}>
          {chords.map((segments, chordIndex) => (
            <Fragment key={chordIndex}>
              {chordIndex > 0 ? (
                <span className="px-0.5 text-muted-foreground/60" aria-hidden>
                  /
                </span>
              ) : null}
              {segments.map((segment, segmentIndex) => (
                <Kbd key={`${chordIndex}-${segmentIndex}`}>{segment}</Kbd>
              ))}
            </Fragment>
          ))}
        </KbdGroup>
      );
    }

    case 'stat': {
      type StatItemView = {
        title: string;
        value: string | number;
        trend?: string;
        trendDirection?: 'up' | 'down';
        footer?: string;
        description?: string;
      };
      const items = (props.items as StatItemView[]) ?? [];
      return (
        <div
          className={cn(
            'grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card @xl/main:grid-cols-2 @5xl/main:grid-cols-4',
            className,
          )}
          style={asStyle(style)}
        >
          {items.map((item, i) => {
            const direction =
              item.trendDirection ??
              (item.trend?.trim().startsWith('-') ? 'down' : item.trend ? 'up' : undefined);
            const TrendIcon = direction === 'down' ? TrendingDown : TrendingUp;
            return (
              <Card key={i} className="@container/card">
                <CardHeader>
                  <CardDescription>{item.title}</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {item.value}
                  </CardTitle>
                  {item.trend ? (
                    <CardAction>
                      <Badge variant="outline" className="gap-1">
                        {direction ? <TrendIcon className="size-3.5" aria-hidden /> : null}
                        {item.trend}
                      </Badge>
                    </CardAction>
                  ) : null}
                </CardHeader>
                {item.footer || item.description ? (
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    {item.footer ? (
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        {item.footer}
                        {direction ? <TrendIcon className="size-4" aria-hidden /> : null}
                      </div>
                    ) : null}
                    {item.description ? (
                      <div className="text-muted-foreground">{item.description}</div>
                    ) : null}
                  </CardFooter>
                ) : null}
              </Card>
            );
          })}
        </div>
      );
    }

    case 'datatable':
      return (
        <BoundDataTable
          id={id}
          props={props}
          className={className}
          style={style}
          emit={emit}
          renderNode={(child, childEmit) => <ElementRenderer node={child} emit={childEmit} />}
        />
      );

    case 'areachart':
      return <BoundAreaChart props={props} className={className} style={style} />;

    case 'barchart':
      return <BoundBarChart props={props} className={className} style={style} />;

    case 'linechart':
      return <BoundLineChart props={props} className={className} style={style} />;

    case 'piechart':
      return <BoundPieChart props={props} className={className} style={style} />;

    case 'radarchart':
      return <BoundRadarChart props={props} className={className} style={style} />;

    case 'radialchart':
      return <BoundRadialChart props={props} className={className} style={style} />;

    case 'scatterchart':
      return <BoundScatterChart props={props} className={className} style={style} />;

    case 'composedchart':
      return <BoundComposedChart props={props} className={className} style={style} />;

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

    case 'upload':
      return <BoundUpload id={id} props={props} className={className} style={style} emit={emit} />;

    default:
      return (
        <div data-unknown-type={type} className={className} style={asStyle(style)}>
          {renderChildren()}
        </div>
      );
  }
}
