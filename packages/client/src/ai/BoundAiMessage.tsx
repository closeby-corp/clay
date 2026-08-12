import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/components/ui/message';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownView } from '../MarkdownView';
import { BoundAiThinking } from './BoundAiThinking';
import { BoundShell, type Emit } from './shared';
import { cn } from '@/lib/utils';

type Source = { id: string; label: string; href?: string };
type Action = { id: string; label: string };

export function BoundAiMessage({
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
  const role = String(props.role ?? 'assistant');
  const text = String(props.text ?? '');
  const streaming = !!props.streaming;
  const sources = Array.isArray(props.sources) ? (props.sources as Source[]) : [];
  const actions = Array.isArray(props.actions) ? (props.actions as Action[]) : [];
  const followUps = Array.isArray(props.followUps)
    ? props.followUps.map((f) => String(f))
    : [];
  const thinking = Array.isArray(props.thinking) ? props.thinking : [];
  const isUser = role === 'user';

  return (
    <BoundShell className={className} style={style}>
      <Message align={isUser ? 'end' : 'start'}>
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{isUser ? 'You' : 'AI'}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>{isUser ? 'You' : 'Assistant'}</MessageHeader>
          {thinking.length > 0 ? (
            <BoundAiThinking
              id={`${id}:thinking`}
              props={{ title: 'Thinking', steps: thinking, open: false }}
              style={undefined}
              emit={() => {}}
            />
          ) : null}
          <Bubble variant={isUser ? 'default' : 'muted'} align={isUser ? 'end' : 'start'}>
            <BubbleContent>
              {isUser ? (
                <p className="whitespace-pre-wrap">{text}</p>
              ) : (
                <MarkdownView text={text} className={cn(streaming && 'opacity-90')} />
              )}
              {streaming ? (
                <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-foreground/70 align-middle" />
              ) : null}
            </BubbleContent>
          </Bubble>
          {sources.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-1">
              <span className="text-xs text-muted-foreground">{sources.length} sources</span>
              {sources.map((s) => (
                <Badge key={s.id} variant="outline" className="font-normal">
                  {s.label}
                </Badge>
              ))}
            </div>
          ) : null}
          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {actions.map((a) => (
                <Button
                  key={a.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => emit(id, 'action', a.id)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          ) : null}
          {followUps.length > 0 ? (
            <MessageFooter>
              <div className="flex w-full flex-col gap-1.5">
                <span className="text-xs">Follow-ups</span>
                <div className="flex flex-wrap gap-1.5">
                  {followUps.map((f) => (
                    <Button
                      key={f}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-auto max-w-full whitespace-normal py-1 text-left"
                      onClick={() => emit(id, 'followUp', f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
            </MessageFooter>
          ) : null}
        </MessageContent>
      </Message>
    </BoundShell>
  );
}
