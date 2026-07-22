import type { PatchBus, StreamWriter, PatchOptions } from '@badui/core';

export class InMemoryPatchBus implements PatchBus {
  private streams = new Map<string, { writer: StreamWriter; abort: AbortController }>();

  subscribe(ctxId: string, writer: StreamWriter, abort: AbortController): void {
    const existing = this.streams.get(ctxId);
    if (existing) {
      existing.abort.abort();
    }
    this.streams.set(ctxId, { writer, abort });
  }

  unsubscribe(ctxId: string): void {
    this.streams.delete(ctxId);
  }

  publish(ctxId: string, patch: PatchOptions): void {
    const entry = this.streams.get(ctxId);
    if (!entry) return;

    if (patch.signals && Object.keys(patch.signals).length > 0) {
      entry.writer.patchSignals(JSON.stringify(patch.signals));
    }
    if (patch.elements) {
      entry.writer.patchElements(patch.elements, {
        selector: patch.selector,
        useViewTransition: patch.useViewTransition ?? true,
      });
    }
  }

  publishAll(patch: PatchOptions): void {
    for (const [ctxId] of this.streams) {
      this.publish(ctxId, patch);
    }
  }

  close(ctxId: string): void {
    const entry = this.streams.get(ctxId);
    if (entry) {
      entry.abort.abort();
      this.streams.delete(ctxId);
    }
  }

  getActiveIds(): string[] {
    return Array.from(this.streams.keys());
  }
}

export const defaultInMemoryPatchBus = new InMemoryPatchBus();
