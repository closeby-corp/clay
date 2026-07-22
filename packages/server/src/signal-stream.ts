import { ServerSentEventGenerator } from '@starfederation/datastar-sdk/web';
import type { PatchBus, StreamWriter } from '@badui/core';
import { InMemoryPatchBus, defaultInMemoryPatchBus } from './in-memory-patch-bus';

export type { PatchBus };
export { InMemoryPatchBus, defaultInMemoryPatchBus };

export function createStreamResponse(
  ctxId: string,
  onClose?: () => void,
  patchBus: PatchBus = defaultInMemoryPatchBus,
): Response {
  const abort = new AbortController();

  return ServerSentEventGenerator.stream((writer) => {
    patchBus.subscribe(ctxId, writer as StreamWriter, abort);

    const heartbeat = setInterval(() => {
      try {
        (writer as StreamWriter).keepalive();
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    abort.signal.addEventListener('abort', () => {
      clearInterval(heartbeat);
      patchBus.unsubscribe(ctxId);
      onClose?.();
    });
  });
}
