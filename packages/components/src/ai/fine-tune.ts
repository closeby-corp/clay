import { Element } from '@close-by/clay-core';
import type { AiFineTuneField } from './types';

export type AiFineTuneProps = {
  title?: string;
  subtitle?: string;
  fields?: AiFineTuneField[];
  className?: string;
  onChange?: (payload: { id: string; value: string | number }) => void | Promise<void>;
};

export function fineTune(props: AiFineTuneProps = {}): Element {
  return new Element('aiFineTune', {
    title: props.title ?? 'Fine-tune',
    subtitle: props.subtitle,
    fields: props.fields ?? [],
    className: props.className,
    onChange: props.onChange,
  });
}
