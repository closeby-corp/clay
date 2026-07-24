import { useEffect, useState, type CSSProperties } from 'react';
import type { ElementNode } from './protocol';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
      {props.label ? <label className="text-sm font-medium">{String(props.label)}</label> : null}
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
      {props.label ? <label className="text-sm font-medium">{String(props.label)}</label> : null}
      <textarea
        className="flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {props.label ? <label className="text-sm font-medium">{String(props.label)}</label> : null}
      <select
        className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        disabled={!!props.disabled}
        style={asStyle(style)}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)} style={asStyle(style)}>
      <div className="flex items-center justify-between text-sm">
        {props.label ? <label className="font-medium">{String(props.label)}</label> : <span />}
        {props.showValue ? <span className="text-muted-foreground">{String(value)}</span> : null}
      </div>
      <input
        type="range"
        min={Number(props.min ?? 0)}
        max={Number(props.max ?? 100)}
        step={Number(props.step ?? 1)}
        value={value}
        disabled={!!props.disabled}
        className="w-full accent-[var(--color-primary)]"
        onChange={(e) => {
          const next = Number(e.target.value);
          setValue(next);
          if (hasEvent(props, 'change')) emit(id, 'change', next);
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
    <label className={cn('flex items-center gap-2 text-sm', className)} style={asStyle(style)}>
      <Checkbox
        checked={checked}
        disabled={!!props.disabled}
        onCheckedChange={(next) => {
          const value = next === true;
          setChecked(value);
          if (hasEvent(props, 'change')) emit(id, 'change', value);
          if (hasEvent(props, 'input')) emit(id, 'input', value);
        }}
      />
      {props.label ? <span>{String(props.label)}</span> : null}
    </label>
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
      return <div className="min-h-screen p-6 md:p-10">{renderChildren()}</div>;

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
        <Badge variant={(props.variant as any) ?? 'default'} className={className} style={asStyle(style)}>
          {String(props.text ?? '')}
        </Badge>
      );

    case 'alert':
      return (
        <div
          className={cn(
            'rounded-md border px-4 py-3 text-sm',
            props.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'bg-muted',
            className,
          )}
          style={asStyle(style)}
        >
          {String(props.text ?? '')}
        </div>
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

    case 'datatable': {
      const columns = (props.columns as Array<{ key: string; header: string; align?: string }>) ?? [];
      const rows = (props.rows as Record<string, unknown>[]) ?? [];
      return (
        <div className={cn('w-full overflow-x-auto rounded-md border', className)} style={asStyle(style)}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={cn('px-3 py-2 text-left font-medium', col.align === 'right' && 'text-right')}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-3 py-2', col.align === 'right' && 'text-right')}>
                      {String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return (
        <div data-unknown-type={type} className={className} style={asStyle(style)}>
          {renderChildren()}
        </div>
      );
  }
}
