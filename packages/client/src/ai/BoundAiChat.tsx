import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BoundAiMessage } from './BoundAiMessage';
import { BoundAiPromptBar } from './BoundAiPromptBar';
import { BoundShell, asIdLabelList, type Emit } from './shared';

type ChatMessage = Record<string, unknown> & { id?: string };

export function BoundAiChat({
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
  const tabs = asIdLabelList(props.tabs);
  const messages = Array.isArray(props.messages) ? (props.messages as ChatMessage[]) : [];
  const serverTab = String(props.activeTab ?? tabs[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState(serverTab);

  useEffect(() => {
    setActiveTab(serverTab);
  }, [serverTab]);

  const body = (
    <div className="flex min-h-[22rem] flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs">
      {tabs.length > 0 ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            emit(id, 'tabChange', v);
          }}
        >
          <TabsList variant="line">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-0" />
          ))}
        </Tabs>
      ) : null}

      <ScrollArea className="min-h-0 flex-1 pr-2">
        <div className="flex flex-col gap-4 py-1">
          {messages.map((m, i) => {
            const mid = String(m.id ?? i);
            return (
              <BoundAiMessage
                key={mid}
                id={`${id}:msg:${mid}`}
                props={m}
                style={undefined}
                emit={(_childId, type, value) => {
                  if (type === 'followUp') emit(id, 'followUp', value);
                  if (type === 'action') {
                    emit(id, 'action', { messageId: mid, actionId: value });
                  }
                }}
              />
            );
          })}
        </div>
      </ScrollArea>

      <BoundAiPromptBar
        id={`${id}:composer`}
        props={{
          placeholder: props.placeholder,
          sources: props.sources,
          models: props.models,
          selectedModel: props.selectedModel,
          disabled: props.disabled,
          showDictate: false,
        }}
        style={undefined}
        emit={(_childId, type, value) => {
          if (
            type === 'submit' ||
            type === 'sourceRemove' ||
            type === 'modelChange' ||
            type === 'command'
          ) {
            emit(id, type, value);
          }
        }}
      />
    </div>
  );

  return (
    <BoundShell className={className} style={style}>
      {body}
    </BoundShell>
  );
}
