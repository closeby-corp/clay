import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Loader2, XCircle, Wrench, FilePenLine, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BoundShell, asIdLabelList, type Emit } from './shared';

type ApprovalOption = { id: string; label: string; description?: string };
type ToolChip = { id: string; label: string; kind?: string; detail?: string };
type Task = {
  id: string;
  title: string;
  status: string;
  detail?: string;
  progress?: number;
  children?: Task[];
};
type Alternative = { id: string; label: string; detail?: string; signal?: string };
type Chunk = {
  id: string;
  title: string;
  text: string;
  charCount?: number;
  sourceLabel?: string;
  sourceKind?: string;
};

export function BoundAiApproval({
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
  const title = String(props.title ?? 'Needs approval');
  const question = String(props.question ?? '');
  const options = Array.isArray(props.options) ? (props.options as ApprovalOption[]) : [];

  return (
    <BoundShell className={className} style={style}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-sm text-foreground">{question}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {options.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant="outline"
              className="h-auto justify-start whitespace-normal py-2 text-left"
              onClick={() => emit(id, 'approve', opt.id)}
            >
              <span className="flex flex-col gap-0.5">
                <span>{opt.label}</span>
                {opt.description ? (
                  <span className="text-xs font-normal text-muted-foreground">{opt.description}</span>
                ) : null}
              </span>
            </Button>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="button" variant="ghost" size="sm" onClick={() => emit(id, 'reject')}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </BoundShell>
  );
}

function chipIcon(kind?: string) {
  if (kind === 'edit') return FilePenLine;
  if (kind === 'message') return MessageSquare;
  return Wrench;
}

export function BoundAiToolChips({
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
  const chips = Array.isArray(props.chips) ? (props.chips as ToolChip[]) : [];
  const summary = props.summary != null ? String(props.summary) : undefined;

  return (
    <BoundShell className={className} style={style}>
      <div className="flex flex-col gap-2">
        {summary ? <p className="text-xs text-muted-foreground">{summary}</p> : null}
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const Icon = chipIcon(c.kind);
            return (
              <button
                key={c.id}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs hover:bg-muted"
                onClick={() => emit(id, 'chipClick', c.id)}
              >
                <Icon className="size-3 text-muted-foreground" />
                <span>{c.label}</span>
                {c.detail ? <span className="text-muted-foreground">{c.detail}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </BoundShell>
  );
}

function TaskRow({
  task,
  depth,
  onClick,
}: {
  task: Task;
  depth: number;
  onClick: (id: string) => void;
}) {
  const Icon =
    task.status === 'completed'
      ? CheckCircle2
      : task.status === 'failed'
        ? XCircle
        : task.status === 'running'
          ? Loader2
          : Circle;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={cn(
          'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onClick(task.id)}
      >
        <Icon
          className={cn(
            'mt-0.5 size-3.5 shrink-0',
            task.status === 'completed' && 'text-emerald-600',
            task.status === 'failed' && 'text-destructive',
            task.status === 'running' && 'animate-spin text-foreground',
            task.status === 'pending' && 'text-muted-foreground',
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{task.title}</span>
            {task.detail ? (
              <span className="text-xs text-muted-foreground">{task.detail}</span>
            ) : null}
          </div>
          {typeof task.progress === 'number' ? (
            <Progress value={Math.max(0, Math.min(100, task.progress))} className="mt-1 h-1" />
          ) : null}
        </div>
      </button>
      {task.children?.map((child) => (
        <TaskRow key={child.id} task={child} depth={depth + 1} onClick={onClick} />
      ))}
    </div>
  );
}

export function BoundAiTasks({
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
  const tasks = Array.isArray(props.tasks) ? (props.tasks as Task[]) : [];

  return (
    <BoundShell className={className} style={style}>
      <div className="rounded-lg border bg-card py-1 shadow-xs">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} depth={0} onClick={(tid) => emit(id, 'taskClick', tid)} />
        ))}
      </div>
    </BoundShell>
  );
}

export function BoundAiRecommendation({
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
  const title = String(props.title ?? 'Recommendation');
  const body = String(props.body ?? '');
  const confidence = typeof props.confidence === 'number' ? props.confidence : undefined;
  const confidenceLabel = props.confidenceLabel != null ? String(props.confidenceLabel) : undefined;
  const alternatives = Array.isArray(props.alternatives)
    ? (props.alternatives as Alternative[])
    : [];
  const acceptLabel = String(props.acceptLabel ?? 'Accept');

  return (
    <BoundShell className={className} style={style}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="whitespace-pre-wrap text-sm text-foreground">{body}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {confidence != null || confidenceLabel ? (
            <div className="flex items-center gap-3">
              {confidence != null ? (
                <Progress value={Math.max(0, Math.min(100, confidence * 100))} className="h-2 flex-1" />
              ) : null}
              <Badge variant="secondary">{confidenceLabel ?? 'Confidence'}</Badge>
            </div>
          ) : null}
          {alternatives.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Other options</span>
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  className="flex items-start justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-sm hover:bg-muted/40"
                  onClick={() => emit(id, 'alternative', alt.id)}
                >
                  <span>
                    <span className="font-medium">{alt.label}</span>
                    {alt.detail ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{alt.detail}</span>
                    ) : null}
                  </span>
                  {alt.signal ? (
                    <Badge variant="outline" className="shrink-0 font-normal">
                      {alt.signal}
                    </Badge>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="button" onClick={() => emit(id, 'accept')}>
            {acceptLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => emit(id, 'reject')}>
            Dismiss
          </Button>
        </CardFooter>
      </Card>
    </BoundShell>
  );
}

export function BoundAiContext({
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
  const title = String(props.title ?? 'Context');
  const chunks = Array.isArray(props.chunks) ? (props.chunks as Chunk[]) : [];

  return (
    <BoundShell className={className} style={style}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}</h3>
          <span className="text-xs text-muted-foreground">{chunks.length} chunks</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {chunks.map((c) => (
            <button
              key={c.id}
              type="button"
              className="rounded-lg border bg-card p-3 text-left shadow-xs hover:bg-muted/30"
              onClick={() => emit(id, 'chunkClick', c.id)}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{c.title}</span>
                {c.charCount != null ? (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {c.charCount} characters
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{c.text}</p>
              {(c.sourceLabel || c.sourceKind) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.sourceKind ? (
                    <Badge variant="outline" className="font-normal">
                      {c.sourceKind}
                    </Badge>
                  ) : null}
                  {c.sourceLabel ? (
                    <Badge variant="secondary" className="font-normal">
                      {c.sourceLabel}
                    </Badge>
                  ) : null}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </BoundShell>
  );
}

void asIdLabelList;
