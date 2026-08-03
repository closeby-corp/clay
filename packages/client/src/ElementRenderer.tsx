import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ElementNode } from './protocol';
import { BoundAppShell } from './AppShell';
import { BoundAreaChart } from './BoundAreaChart';
import { BoundDataTable } from './BoundDataTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

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
