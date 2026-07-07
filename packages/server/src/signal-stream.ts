import { ServerSentEventGenerator } from '@starfederation/datastar-sdk/web';
import type { PatchOptions } from './patch-response';

export interface ActiveStream {
  ctxId: string;
  stream: ReturnType<typeof ServerSentEventGenerator.stream> extends Response ? never : unknown;
  patch: (options: PatchOptions) => void;
  close: () => void;
}

type StreamWriter = {
  patchSignals: (json: string) => void;
  patchElements: (html: string, options?: { selector?: string; useViewTransition?: boolean }) => void;
  keepalive: () => void;
};

const streams = new Map<string, { writer: StreamWriter; abort: AbortController }>();

export const signalStreamRegistry = {
  register(ctxId: string, writer: StreamWriter, abort: AbortController): void {
    const existing = streams.get(ctxId);
    if (existing) {
      existing.abort.abort();
    }
    streams.set(ctxId, { writer, abort });
  },

  unregister(ctxId: string): void {
    streams.delete(ctxId);
  },

  has(ctxId: string): boolean {
    return streams.has(ctxId);
  },

  patch(ctxId: string, options: PatchOptions): boolean {
    const entry = streams.get(ctxId);
    if (!entry) return false;

    if (options.signals && Object.keys(options.signals).length > 0) {
      entry.writer.patchSignals(JSON.stringify(options.signals));
    }
    if (options.elements) {
      entry.writer.patchElements(options.elements, {
        selector: options.selector,
        useViewTransition: options.useViewTransition ?? true,
      });
    }
    return true;
  },

  patchAll(options: PatchOptions): void {
    for (const [ctxId] of streams) {
      this.patch(ctxId, options);
    }
  },

  close(ctxId: string): void {
    const entry = streams.get(ctxId);
    if (entry) {
      entry.abort.abort();
      streams.delete(ctxId);
    }
  },

  getActiveIds(): string[] {
    return Array.from(streams.keys());
  },
};

export function createStreamResponse(
  ctxId: string,
  onClose?: () => void,
): Response {
  const abort = new AbortController();

  return ServerSentEventGenerator.stream((writer) => {
    signalStreamRegistry.register(ctxId, writer as StreamWriter, abort);

    const heartbeat = setInterval(() => {
      try {
        (writer as StreamWriter).keepalive();
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    abort.signal.addEventListener('abort', () => {
      clearInterval(heartbeat);
      signalStreamRegistry.unregister(ctxId);
      onClose?.();
    });
  });
}
