export type NotifyType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type ElementNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children: ElementNode[];
};

export type Patch =
  | { op: 'replace'; id: string; node: ElementNode }
  | { op: 'updateProps'; id: string; props: Record<string, unknown> }
  | { op: 'setChildren'; id: string; children: ElementNode[] }
  /** Append `rows` to the array prop `prop`, then keep only the last `max` items when set. */
  | { op: 'appendRows'; id: string; prop: string; rows: unknown[]; max?: number }
  | { op: 'remove'; id: string };

export type ServerMessage =
  | { op: 'clientVersion'; version: string }
  | { op: 'mount'; sessionId: string; tree: ElementNode }
  | { op: 'patch'; patches: Patch[] }
  | { op: 'navigate'; path: string }
  | {
      op: 'notify';
      id?: string;
      message: string;
      type?: NotifyType;
      duration?: number;
      position?: ToastPosition;
      description?: string;
    }
  | { op: 'dismissNotify'; id: string }
  | { op: 'download'; filename: string; mime: string; content: string }
  | { op: 'clipboard'; content: string }
  | { op: 'theme'; theme: 'light' | 'dark' | 'system' }
  /** Colour palette name → `<html data-palette>` (`kiln` / empty = default). */
  | { op: 'palette'; palette: string }
  /** Interface sounds: toggle automatic cues, set volume, or play one cue now. */
  | { op: 'sound'; enabled?: boolean; volume?: number; play?: string }
  | { op: 'runJavaScript'; code: string }
  | { op: 'setUrlHash'; hash: string }
  | { op: 'setUrlSearch'; search: string; mode?: 'replace' | 'push' }
  | { op: 'openExternal'; url: string }
  | { op: 'redirect'; url: string }
  | {
      op: 'scroll';
      target: 'window' | 'selector';
      top?: number | 'top' | 'bottom';
      left?: number;
      behavior?: 'auto' | 'smooth';
      selector?: string;
      block?: 'start' | 'center' | 'end' | 'nearest';
      inline?: 'start' | 'center' | 'end' | 'nearest';
    }
  | {
      op: 'clientStorage';
      scope: 'browser' | 'client' | 'tab';
      action: 'set' | 'delete' | 'clear';
      key?: string;
      value?: unknown;
    }
  | { op: 'reconnect' }
  | {
      op: 'authSession';
      action: 'establish' | 'clear';
      token?: string;
      path?: string;
    }
  | { op: 'error'; message: string };

export type ClientMessage =
  | {
      op: 'hello';
      path: string;
      userId?: string;
      hash?: string;
      /** `location.search` without leading `?`. */
      search?: string;
      browserStorage?: Record<string, unknown>;
      clientStorage?: Record<string, unknown>;
      tabStorage?: Record<string, unknown>;
      /** Palette the page currently shows (`<html data-palette>`, `kiln` when unset). */
      palette?: string;
    }
  | { op: 'event'; id: string; type: string; value?: unknown }
  /** Same-path popstate: search/hash only (no remount). */
  | { op: 'urlchange'; search?: string; hash?: string };
