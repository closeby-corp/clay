import { ServerSentEventGenerator } from '@starfederation/datastar-sdk/web';

export interface PatchOptions {
  elements?: string;
  signals?: Record<string, unknown>;
  selector?: string;
  useViewTransition?: boolean;
}

export function patchResponse(patches: PatchOptions): Response {
  return ServerSentEventGenerator.stream((stream) => {
    if (patches.signals && Object.keys(patches.signals).length > 0) {
      stream.patchSignals(JSON.stringify(patches.signals));
    }
    if (patches.elements) {
      const elementOptions: { selector?: string; useViewTransition?: boolean } = {
        useViewTransition: patches.useViewTransition ?? true,
      };
      if (patches.selector) {
        elementOptions.selector = patches.selector;
      }
      stream.patchElements(patches.elements, elementOptions);
    }
  });
}
