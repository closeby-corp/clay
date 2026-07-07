import { ServerSentEventGenerator } from '@starfederation/datastar-sdk/web';

export interface BadUIEventSignals {
  /** Component id — sent as a Datastar signal (not __-prefixed; those are filtered client-side). */
  compId: string;
  /** Event type dispatched to eventRegistry. */
  evtType: string;
  ctxId?: string;
  dsValKey?: string;
  value?: string;
  files?: unknown;
  [key: string]: unknown;
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export async function readBadUISignals(req: Request): Promise<BadUIEventSignals> {
  const result = await ServerSentEventGenerator.readSignals(req);
  if (!result.success) {
    throw new BadRequestError(result.error ?? 'Invalid signals');
  }
  return result.signals as BadUIEventSignals;
}
