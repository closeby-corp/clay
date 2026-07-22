export interface PatchOptions {
  elements?: string;
  signals?: Record<string, unknown>;
  selector?: string;
  useViewTransition?: boolean;
}

export interface StreamWriter {
  patchSignals(json: string): void;
  patchElements(html: string, options?: { selector?: string; useViewTransition?: boolean }): void;
  keepalive(): void;
}

export interface PatchBus {
  subscribe(ctxId: string, writer: StreamWriter, abort: AbortController): void;
  unsubscribe(ctxId: string): void;
  publish(ctxId: string, patch: PatchOptions): void;
  publishAll(patch: PatchOptions): void;
  close(ctxId: string): void;
  getActiveIds(): string[];
}
