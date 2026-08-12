import { useEffect, useState } from 'react';
import { Mic, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BoundShell, asIdLabelList, type Emit } from './shared';

export function BoundAiPromptBar({
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
  const placeholder = String(props.placeholder ?? 'Ask…');
  const sources = asIdLabelList(props.sources);
  const models = asIdLabelList(props.models);
  const commands = asIdLabelList(props.commands);
  const variant = String(props.variant ?? 'rounded');
  const showDictate = props.showDictate !== false;
  const disabled = !!props.disabled;
  const serverValue = String(props.value ?? '');
  const serverModel = String(props.selectedModel ?? models[0]?.id ?? '');

  const [draft, setDraft] = useState(serverValue);
  const [model, setModel] = useState(serverModel);

  useEffect(() => {
    setDraft(serverValue);
  }, [serverValue]);

  useEffect(() => {
    setModel(serverModel);
  }, [serverModel]);

  const submit = () => {
    const text = draft.trim();
    if (!text || disabled) return;
    emit(id, 'submit', text);
    setDraft('');
    emit(id, 'change', '');
  };

  return (
    <BoundShell className={className} style={style}>
      <div
        className={cn(
          'flex flex-col gap-2 border bg-card p-2 shadow-xs',
          variant === 'pill' ? 'rounded-full px-3' : 'rounded-xl',
        )}
      >
        {sources.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-1">
            {sources.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1 pr-1 font-normal">
                @{s.label}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-muted"
                  aria-label={`Remove ${s.label}`}
                  disabled={disabled}
                  onClick={() => emit(id, 'sourceRemove', s.id)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className={cn('flex items-end gap-2', variant === 'pill' && 'items-center')}>
          <Textarea
            value={draft}
            disabled={disabled}
            placeholder={placeholder}
            rows={variant === 'pill' ? 1 : 2}
            className={cn(
              'min-h-0 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0',
              variant === 'pill' && 'py-2',
            )}
            onChange={(e) => {
              setDraft(e.target.value);
              emit(id, 'change', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === '/' && draft === '' && commands.length) {
                // affordance only — apps listen via command event from picker
              }
            }}
          />

          {models.length > 0 ? (
            <Select
              value={model}
              disabled={disabled}
              onValueChange={(v) => {
                if (!v) return;
                setModel(v);
                emit(id, 'modelChange', v);
              }}
            >
              <SelectTrigger className="h-8 w-[8.5rem] shrink-0">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {showDictate ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              disabled={disabled}
              aria-label="Dictate"
              onClick={() => emit(id, 'dictate')}
            >
              <Mic className="size-4" />
            </Button>
          ) : null}

          <Button
            type="button"
            size="icon"
            className="size-8 shrink-0"
            disabled={disabled || !draft.trim()}
            aria-label="Send"
            onClick={submit}
          >
            <Send className="size-4" />
          </Button>
        </div>

        {commands.length > 0 ? (
          <div className="flex flex-wrap gap-1 px-1 pb-0.5">
            {commands.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-muted-foreground"
                disabled={disabled}
                onClick={() => emit(id, 'command', c.id)}
              >
                /{c.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </BoundShell>
  );
}
