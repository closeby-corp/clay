import { Element } from '@close-by/clay-core';
import type { AiIdLabel } from './types';

export type AiPromptBarVariant = 'rounded' | 'pill';

export type AiPromptBarProps = {
  placeholder?: string;
  value?: string;
  sources?: AiIdLabel[];
  models?: AiIdLabel[];
  selectedModel?: string;
  commands?: AiIdLabel[];
  /** Visual shell variant. */
  variant?: AiPromptBarVariant;
  /** Show dictation affordance (fires `dictate` stub event only). */
  showDictate?: boolean;
  disabled?: boolean;
  className?: string;
  onSubmit?: (value: string) => void | Promise<void>;
  onSourceRemove?: (sourceId: string) => void | Promise<void>;
  onModelChange?: (modelId: string) => void | Promise<void>;
  onCommand?: (commandId: string) => void | Promise<void>;
  onDictate?: () => void | Promise<void>;
  onChange?: (value: string) => void | Promise<void>;
};

export function promptBar(props: AiPromptBarProps = {}): Element {
  return new Element('aiPromptBar', {
    placeholder: props.placeholder ?? 'Ask…',
    value: props.value ?? '',
    sources: props.sources ?? [],
    models: props.models ?? [],
    selectedModel: props.selectedModel ?? props.models?.[0]?.id,
    commands: props.commands ?? [],
    variant: props.variant ?? 'rounded',
    showDictate: props.showDictate !== false,
    disabled: props.disabled ?? false,
    className: props.className,
    onSubmit: props.onSubmit,
    onSourceRemove: props.onSourceRemove,
    onModelChange: props.onModelChange,
    onCommand: props.onCommand,
    onDictate: props.onDictate,
    onChange: props.onChange,
  });
}
