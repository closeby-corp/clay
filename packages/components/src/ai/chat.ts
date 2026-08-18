import { Element } from '@close-by/clay-core';
import type { AiChatMessage, AiChatTab, AiIdLabel } from './types';
import { serializeChatMessage } from './message';

export type AiChatProps = {
  tabs?: AiChatTab[];
  activeTab?: string;
  messages?: AiChatMessage[];
  placeholder?: string;
  sources?: AiIdLabel[];
  models?: AiIdLabel[];
  selectedModel?: string;
  disabled?: boolean;
  className?: string;
  onSubmit?: (text: string) => void | Promise<void>;
  onTabChange?: (tabId: string) => void | Promise<void>;
  onFollowUp?: (text: string) => void | Promise<void>;
  onAction?: (payload: { messageId: string; actionId: string }) => void | Promise<void>;
  onSourceRemove?: (sourceId: string) => void | Promise<void>;
  onModelChange?: (modelId: string) => void | Promise<void>;
  onCommand?: (command: string) => void | Promise<void>;
};

function cloneMessages(messages: AiChatMessage[]): AiChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    streaming: m.streaming,
    sources: m.sources?.map((s) => ({ ...s })),
    actions: m.actions?.map((a) => ({ ...a })),
    followUps: m.followUps ? [...m.followUps] : undefined,
    thinking: m.thinking?.map((t) => ({ ...t })),
  }));
}

/**
 * Tabbed AI chat surface. Owns `messages` + `activeTab` for convenient
 * `setMessages` / `setActiveTab` patches (Kanban-style). Visual only —
 * the app supplies message text; no model runtime.
 */
export class AiChatElement extends Element {
  constructor(props: AiChatProps = {}) {
    const {
      onSubmit,
      onTabChange,
      onFollowUp,
      onAction,
      onSourceRemove,
      onModelChange,
      onCommand,
      messages = [],
      tabs = [],
      activeTab,
      ...rest
    } = props;

    const owned = cloneMessages(messages);
    const tabId = activeTab ?? tabs[0]?.id;

    super('aiChat', {
      tabs,
      activeTab: tabId,
      messages: owned.map(serializeChatMessage),
      placeholder: rest.placeholder ?? 'Ask…',
      sources: rest.sources ?? [],
      models: rest.models ?? [],
      selectedModel: rest.selectedModel ?? rest.models?.[0]?.id,
      disabled: rest.disabled ?? false,
      className: rest.className,
      onSubmit,
      onTabChange,
      onFollowUp,
      onAction,
      onSourceRemove,
      onModelChange,
      onCommand,
    });
  }

  getMessages(): AiChatMessage[] {
    const raw = (this.props.messages as Record<string, unknown>[]) ?? [];
    return cloneMessages(
      raw.map((m) => ({
        id: String(m.id ?? ''),
        role: (m.role as AiChatMessage['role']) ?? 'assistant',
        text: String(m.text ?? ''),
        streaming: !!m.streaming,
        sources: (m.sources as AiChatMessage['sources']) ?? [],
        actions: (m.actions as AiChatMessage['actions']) ?? [],
        followUps: (m.followUps as string[]) ?? [],
        thinking: (m.thinking as AiChatMessage['thinking']) ?? [],
      })),
    );
  }

  setMessages(messages: AiChatMessage[]): this {
    const owned = cloneMessages(messages);
    this.props.messages = owned.map(serializeChatMessage);
    this.queuePropsPatch({ messages: this.props.messages });
    return this;
  }

  getActiveTab(): string | undefined {
    return this.props.activeTab as string | undefined;
  }

  setActiveTab(tabId: string): this {
    this.props.activeTab = tabId;
    this.queuePropsPatch({ activeTab: tabId });
    return this;
  }
}

export function chat(props: AiChatProps = {}): AiChatElement {
  return new AiChatElement(props);
}
