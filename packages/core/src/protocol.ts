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
  | { op: 'remove'; id: string };

export type ServerMessage =
  | { op: 'mount'; sessionId: string; tree: ElementNode }
  | { op: 'patch'; patches: Patch[] }
  | { op: 'navigate'; path: string }
  | {
      op: 'notify';
      id: string;
      message: string;
      type?: NotifyType;
      duration?: number;
      position?: ToastPosition;
    }
  | { op: 'dismissNotify'; id: string }
  | { op: 'download'; filename: string; mime: string; content: string }
  | { op: 'clipboard'; content: string }
  | { op: 'error'; message: string };

export type ClientMessage =
  | { op: 'hello'; path: string }
  | { op: 'event'; id: string; type: string; value?: unknown };
