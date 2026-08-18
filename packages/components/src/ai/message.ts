import { Element } from '@close-by/clay-core';
import type {
  AiChatMessage,
  AiMessageAction,
  AiMessageRole,
  AiMessageSource,
  AiThinkingStep,
} from './types';

export type AiMessageProps = {
  role?: AiMessageRole;
  text?: string;
  streaming?: boolean;
  sources?: AiMessageSource[];
  actions?: AiMessageAction[];
  followUps?: string[];
  thinking?: AiThinkingStep[];
  className?: string;
  onFollowUp?: (text: string) => void | Promise<void>;
  onAction?: (actionId: string) => void | Promise<void>;
};

export function message(props: AiMessageProps = {}): Element {
  return new Element('aiMessage', {
    role: props.role ?? 'assistant',
    text: props.text ?? '',
    streaming: props.streaming ?? false,
    sources: props.sources ?? [],
    actions: props.actions ?? [],
    followUps: props.followUps ?? [],
    thinking: props.thinking ?? [],
    className: props.className,
    onFollowUp: props.onFollowUp,
    onAction: props.onAction,
  });
}

/** Normalize a chat message blob for wire props. */
export function serializeChatMessage(m: AiChatMessage): Record<string, unknown> {
  return {
    id: m.id,
    role: m.role,
    text: m.text,
    streaming: m.streaming ?? false,
    sources: m.sources ?? [],
    actions: m.actions ?? [],
    followUps: m.followUps ?? [],
    thinking: m.thinking ?? [],
  };
}
