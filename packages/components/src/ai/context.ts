import { Element } from '@clay/core';
import type { AiContextChunk } from './types';

export type AiContextProps = {
  chunks?: AiContextChunk[];
  title?: string;
  className?: string;
  onChunkClick?: (chunkId: string) => void | Promise<void>;
};

export function context(props: AiContextProps = {}): Element {
  return new Element('aiContext', {
    chunks: props.chunks ?? [],
    title: props.title ?? 'Context',
    className: props.className,
    onChunkClick: props.onChunkClick,
  });
}
