import { Element, withParent } from '@badui/core';

export type FlowPosition = { x: number; y: number };

export type FlowHandlePosition = 'top' | 'right' | 'bottom' | 'left';

export type FlowHandle = {
  id: string;
  type: 'source' | 'target';
  position: FlowHandlePosition;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type FlowConnectPayload = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type FlowNodeMovePayload = {
  nodeId: string;
  position: FlowPosition;
};

export type FlowSelectionPayload = {
  nodeIds: string[];
  edgeIds: string[];
};

export type FlowNodeProps = {
  /** Graph node id (used by edges / React Flow). */
  id: string;
  position: FlowPosition;
  handles?: FlowHandle[];
  className?: string;
};

export type FlowProps = {
  edges?: FlowEdge[];
  fitView?: boolean;
  showMiniMap?: boolean;
  showControls?: boolean;
  className?: string;
  onConnect?: (payload: FlowConnectPayload) => void | Promise<void>;
  /** Fired once when a node drag ends — persist `position` so the server stays source of truth. */
  onNodeMove?: (payload: FlowNodeMovePayload) => void | Promise<void>;
  onNodesDelete?: (ids: string[]) => void | Promise<void>;
  onEdgesDelete?: (ids: string[]) => void | Promise<void>;
  onSelectionChange?: (payload: FlowSelectionPayload) => void | Promise<void>;
};

export class FlowElement extends Element {
  constructor(props: FlowProps = {}) {
    super('flow', {
      edges: props.edges ?? [],
      fitView: props.fitView ?? true,
      showMiniMap: props.showMiniMap ?? true,
      showControls: props.showControls ?? true,
      className: props.className,
      onConnect: props.onConnect,
      onNodeMove: props.onNodeMove,
      onNodesDelete: props.onNodesDelete,
      onEdgesDelete: props.onEdgesDelete,
      onSelectionChange: props.onSelectionChange,
    });
  }

  /**
   * Add a graph node. Children render as the BadUI body inside React Flow chrome
   * (drag by the card; buttons/inputs stay clickable via nodrag).
   */
  node(opts: FlowNodeProps, fn: () => void): Element {
    const panel = new Element('flowNode', {
      id: opts.id,
      position: opts.position,
      handles: opts.handles,
      className: opts.className,
    });
    withParent(panel, fn);
    return panel;
  }
}

export function flow(fn: (flow: FlowElement) => void, props?: FlowProps): FlowElement;
export function flow(props: FlowProps, fn: (flow: FlowElement) => void): FlowElement;
export function flow(
  propsOrFn: FlowProps | ((flow: FlowElement) => void),
  fnOrProps?: ((flow: FlowElement) => void) | FlowProps,
): FlowElement {
  let props: FlowProps = {};
  let fn: (flow: FlowElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as FlowProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (flow: FlowElement) => void;
  }

  const el = new FlowElement(props);
  withParent(el, () => fn(el));
  return el;
}
