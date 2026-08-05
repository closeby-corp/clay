import { lazy, Suspense, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ElementNode } from './protocol';
import { BoundAppShell } from './AppShell';
import { BoundAreaChart } from './BoundAreaChart';
import { BoundBarChart } from './BoundBarChart';
import { BoundLineChart } from './BoundLineChart';
import { BoundPieChart } from './BoundPieChart';
import { BoundRadarChart } from './BoundRadarChart';
import { BoundRadialChart } from './BoundRadialChart';
import { BoundDataTable } from './BoundDataTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CalendarIcon, ChevronDownIcon, TrendingDown, TrendingUp } from 'lucide-react';
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

function useOptimisticValue<T>(serverValue: T): [T, (next: T) => void] {
  const [local, setLocal] = useState(serverValue);
  const prev = useRef(serverValue);
  if (prev.current !== serverValue) {
    prev.current = serverValue;
    setLocal(serverValue);
  }
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
    <div className={cn('flex w-full flex-col gap-1.5', className)} style={asStyle(style)}>
      {props.label ? <Label htmlFor={`in-${id}`}>{String(props.label)}</Label> : null}
      <Input
        id={`in-${id}`}
        type={String(props.type ?? 'text')}
        value={value}
        placeholder={props.placeholder ? String(props.placeholder) : undefined}
        disabled={!!props.disabled}
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
    <div className={cn('flex w-full flex-col gap-1.5', className)} style={asStyle(style)}>
      {props.label ? <Label htmlFor={`ta-${id}`}>{String(props.label)}</Label> : null}
      <Textarea
        id={`ta-${id}`}
        value={value}
        placeholder={props.placeholder ? String(props.placeholder) : undefined}
        disabled={!!props.disabled}
        rows={typeof props.rows === 'number' ? props.rows : undefined}
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
  const serverValue = String(props.value ?? '');
  const [value, setValue] = useOptimisticValue(serverValue);
  const options = (props.options as Array<{ value: string; label: string }>) ?? [];

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Select
        value={value || undefined}
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
  const serverValue = Number(props.value ?? props.min ?? 0);
  const [value, setValue] = useOptimisticValue(serverValue);
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = Number(props.step ?? 1);

  return (
    <div className={cn('flex w-full flex-col gap-2', className)} style={asStyle(style)}>
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
        onValueChange={(vals) => {
          const n = vals[0] ?? min;
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
  const serverValue = Boolean(props.checked ?? props.value ?? false);
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

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)} style={asStyle(style)}>
      <Switch
        id={`sw-${id}`}
        checked={checked}
        disabled={!!props.disabled}
        size={props.size === 'sm' ? 'sm' : 'default'}
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

  return (
    <div className={cn('flex w-full flex-col gap-2', className)} style={asStyle(style)}>
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <RadioGroup
        value={value || undefined}
        disabled={!!props.disabled}
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

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)} style={asStyle(style)}>
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

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)} style={asStyle(style)}>
      {props.label ? <Label>{String(props.label)}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`date-${id}`}
            variant="outline"
            disabled={!!props.disabled}
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = String(props.label ?? 'Upload');
  const accept = props.accept ? String(props.accept) : undefined;
  const multiple = !!props.multiple;
  const disabled = !!props.disabled || busy;

  return (
    <div className={cn('flex flex-col gap-1.5', className)} style={asStyle(style)}>
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
          const run = async () => {
            setBusy(true);
            setError(null);
            try {
              const fd = new FormData();
              for (const file of Array.from(list)) {
                fd.append('files', file);
              }
              const res = await fetch('/upload', { method: 'POST', body: fd });
              const data = (await res.json()) as {
                files?: Array<{ name: string; size: number; type: string; path: string }>;
                error?: string;
              };
              if (!res.ok) {
                throw new Error(data.error || `Upload failed (${res.status})`);
              }
              for (const file of data.files ?? []) {
                if (hasEvent(props, 'upload')) emit(id, 'upload', file);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            } finally {
              setBusy(false);
              if (inputRef.current) inputRef.current.value = '';
            }
          };
          void run();
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'Uploading…' : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
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
          className={cn('badui-html', className)}
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
