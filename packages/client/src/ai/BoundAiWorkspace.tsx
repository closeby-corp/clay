import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BoundShell, asIdLabelList, type Emit } from './shared';

type DiffCol = { id: string; label: string };
type DiffRow = {
  id: string;
  cells: Record<string, string | number | null | undefined>;
  changedKeys?: string[];
};
type Insight = {
  id: string;
  title?: string;
  text: string;
  metric?: string;
  delta?: string;
  tone?: string;
};
type Action = { id: string; label: string };
type FineField =
  | {
      id: string;
      kind: 'number';
      label: string;
      value: number;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
    }
  | {
      id: string;
      kind: 'select';
      label: string;
      value: string;
      options: { id: string; label: string }[];
    }
  | {
      id: string;
      kind: 'text';
      label: string;
      value: string;
      placeholder?: string;
    };

export function BoundAiDiffTable({
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
  const title = props.title != null ? String(props.title) : undefined;
  const columns = Array.isArray(props.columns) ? (props.columns as DiffCol[]) : [];
  const rows = Array.isArray(props.rows) ? (props.rows as DiffRow[]) : [];

  return (
    <BoundShell className={className} style={style}>
      <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
        {title ? (
          <div className="border-b px-3 py-2 text-sm font-medium">{title}</div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                {columns.map((c) => (
                  <th key={c.id} className="px-3 py-2 font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const changed = new Set(row.changedKeys ?? []);
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                    onClick={() => emit(id, 'rowClick', row.id)}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.id}
                        className={cn(
                          'px-3 py-2',
                          changed.has(c.id) && 'bg-amber-500/10 font-medium text-amber-900 dark:text-amber-200',
                        )}
                      >
                        {row.cells[c.id] == null ? '—' : String(row.cells[c.id])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </BoundShell>
  );
}

export function BoundAiInsights({
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
  const title = String(props.title ?? 'Insights');
  const insights = Array.isArray(props.insights) ? (props.insights as Insight[]) : [];
  const serverIndex = Math.max(0, Number(props.index ?? 0));
  const prompt = props.prompt != null ? String(props.prompt) : undefined;
  const [index, setIndex] = useState(serverIndex);

  useEffect(() => {
    setIndex(Math.min(serverIndex, Math.max(0, insights.length - 1)));
  }, [serverIndex, insights.length]);

  const current = insights[index];

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(insights.length - 1, next));
    setIndex(clamped);
    emit(id, 'indexChange', clamped);
  };

  return (
    <BoundShell className={className} style={style}>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>
              {insights.length ? `${index + 1} / ${insights.length}` : '0'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={index <= 0}
              onClick={() => go(index - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={index >= insights.length - 1}
              onClick={() => go(index + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {current ? (
            <>
              {current.title ? <p className="text-sm font-medium">{current.title}</p> : null}
              <p className="text-sm leading-relaxed">{current.text}</p>
              <div className="flex flex-wrap gap-2">
                {current.metric ? <Badge variant="secondary">{current.metric}</Badge> : null}
                {current.delta ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      current.tone === 'positive' && 'border-emerald-500/40 text-emerald-700',
                      current.tone === 'negative' && 'border-destructive/40 text-destructive',
                    )}
                  >
                    {current.delta}
                  </Badge>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No insights</p>
          )}
        </CardContent>
        {prompt ? (
          <CardFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => emit(id, 'prompt')}>
              {prompt}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </BoundShell>
  );
}

export function BoundAiSelectionActions({
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
  const selection = String(props.selection ?? '');
  const actions = Array.isArray(props.actions) ? (props.actions as Action[]) : [];

  return (
    <BoundShell className={className} style={style}>
      <div className="rounded-lg border bg-card p-3 shadow-xs">
        <blockquote className="mb-3 border-l-2 border-foreground/20 pl-3 text-sm leading-relaxed text-muted-foreground">
          {selection}
        </blockquote>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <Button
              key={a.id}
              type="button"
              size="sm"
              variant="secondary"
              className="h-7"
              onClick={() => emit(id, 'action', a.id)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </BoundShell>
  );
}

export function BoundAiFineTune({
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
  const title = String(props.title ?? 'Fine-tune');
  const subtitle = props.subtitle != null ? String(props.subtitle) : undefined;
  const fields = Array.isArray(props.fields) ? (props.fields as FineField[]) : [];
  const [local, setLocal] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {};
    for (const f of fields) init[f.id] = f.value;
    return init;
  });

  useEffect(() => {
    const next: Record<string, string | number> = {};
    for (const f of fields) next[f.id] = f.value;
    setLocal(next);
  }, [JSON.stringify(fields.map((f) => [f.id, f.value]))]);

  const setField = (fid: string, value: string | number) => {
    setLocal((prev) => ({ ...prev, [fid]: value }));
    emit(id, 'change', { id: fid, value });
  };

  return (
    <BoundShell className={className} style={style}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.id} className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                {f.label}
                {f.kind === 'number' && f.unit ? ` (${f.unit})` : ''}
              </span>
              {f.kind === 'number' ? (
                <Input
                  type="number"
                  value={Number(local[f.id] ?? f.value)}
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  onChange={(e) => setField(f.id, Number(e.target.value))}
                />
              ) : f.kind === 'select' ? (
                <Select
                  value={String(local[f.id] ?? f.value)}
                  onValueChange={(v) => {
                    if (v) setField(f.id, v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={String(local[f.id] ?? f.value)}
                  placeholder={f.placeholder}
                  onChange={(e) => setField(f.id, e.target.value)}
                />
              )}
            </label>
          ))}
        </CardContent>
      </Card>
    </BoundShell>
  );
}

void asIdLabelList;
