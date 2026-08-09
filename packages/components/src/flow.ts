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
  /**
   * Fired after the flow appends the new edge to its owned model.
   * Prefer side effects here; diagram topology is already updated.
   */
  onConnect?: (payload: FlowConnectPayload) => void | Promise<void>;
  /**
   * Fired once when a node drag ends — after the flow persists `position`
   * on the owned model. Prefer side effects here.
   */
  onNodeMove?: (payload: FlowNodeMovePayload) => void | Promise<void>;
  /** Fired after owned nodes (and connected edges) are removed. */
  onNodesDelete?: (ids: string[]) => void | Promise<void>;
  /** Fired after owned edges are removed. */
  onEdgesDelete?: (ids: string[]) => void | Promise<void>;
  onSelectionChange?: (payload: FlowSelectionPayload) => void | Promise<void>;
};

function cloneEdge(edge: FlowEdge): FlowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  };
}

function clonePosition(position: FlowPosition): FlowPosition {
  return { x: Number(position.x) || 0, y: Number(position.y) || 0 };
}

/**
 * Interactive flow diagram. Owns edges + node positions (DataTable-style);
 * default settle handlers update that model before user callbacks run.
 * Prefer mutating via element APIs instead of wrapping the whole flow in `ui.auto`.
 */
export class FlowElement extends Element {
  /** Graph-id → last known position (seeded by `node` / `addNode` / `moveNode`). */
  private positions: Record<string, FlowPosition> = {};

  constructor(props: FlowProps = {}) {
    const {
      onConnect,
      onNodeMove,
      onNodesDelete,
      onEdgesDelete,
      onSelectionChange,
      edges,
      fitView,
      showMiniMap,
      showControls,
      className,
    } = props;

    super('flow', {
      edges: (edges ?? []).map(cloneEdge),
      fitView: fitView ?? true,
      showMiniMap: showMiniMap ?? true,
      showControls: showControls ?? true,
      className,
    });

    // Always register settle events so the client emits them; update owned
    // model first, then chain user callbacks for side effects.
    this.on('nodeMove', (value) => {
      const payload = value as FlowNodeMovePayload;
      if (!payload?.nodeId || !payload.position) return;
      this.moveNode(payload.nodeId, payload.position);
    });
    if (onNodeMove) {
      this.on('nodeMove', (value) => onNodeMove(value as FlowNodeMovePayload));
    }

    this.on('connect', (value) => {
      const payload = value as FlowConnectPayload;
      if (!payload?.source || !payload?.target) return;
      this.addEdge({
        id: `e-${payload.source}-${payload.target}-${payload.sourceHandle ?? ''}-${payload.targetHandle ?? ''}-${Date.now()}`,
        source: payload.source,
        target: payload.target,
        sourceHandle: payload.sourceHandle ?? undefined,
        targetHandle: payload.targetHandle ?? undefined,
      });
    });
    if (onConnect) {
      this.on('connect', (value) => onConnect(value as FlowConnectPayload));
    }

    this.on('edgesDelete', (value) => {
      const ids = value as string[];
      if (!Array.isArray(ids) || ids.length === 0) return;
      this.removeEdges(ids);
    });
    if (onEdgesDelete) {
      this.on('edgesDelete', (value) => onEdgesDelete(value as string[]));
    }

    this.on('nodesDelete', (value) => {
      const ids = value as string[];
      if (!Array.isArray(ids) || ids.length === 0) return;
      for (const id of ids) this.removeNode(id);
    });
    if (onNodesDelete) {
      this.on('nodesDelete', (value) => onNodesDelete(value as string[]));
    }

    if (onSelectionChange) {
      this.on('selectionChange', (value) =>
        onSelectionChange(value as FlowSelectionPayload),
      );
    }
  }

  getEdges(): FlowEdge[] {
    return ((this.props.edges as FlowEdge[] | undefined) ?? []).map(cloneEdge);
  }

  setEdges(edges: FlowEdge[]): this {
    this.update({ edges: edges.map(cloneEdge) });
    return this;
  }

  getPositions(): Record<string, FlowPosition> {
    const out: Record<string, FlowPosition> = {};
    for (const [id, pos] of Object.entries(this.positions)) {
      out[id] = clonePosition(pos);
    }
    return out;
  }

  getNodeIds(): string[] {
    return this.children
      .filter((c) => c.type === 'flowNode')
      .map((c) => String(c.props.id ?? ''));
  }

  moveNode(id: string, position: FlowPosition): this {
    const next = clonePosition(position);
    this.positions[id] = next;
    const child = this.findNode(id);
    if (child) child.update({ position: next });
    return this;
  }

  addEdge(edge: FlowEdge): this {
    const edges = this.getEdges();
    if (edges.some((e) => e.id === edge.id)) return this;
    this.setEdges([...edges, cloneEdge(edge)]);
    return this;
  }

  removeEdges(ids: string[]): this {
    if (ids.length === 0) return this;
    const drop = new Set(ids);
    const edges = this.getEdges();
    const next = edges.filter((e) => !drop.has(e.id));
    if (next.length === edges.length) return this;
    this.setEdges(next);
    return this;
  }

  /**
   * Add a graph node. Children render as the BadUI body inside React Flow chrome
   * (drag by the card; buttons/inputs stay clickable via nodrag).
   * During initial `ui.flow` build the current parent is the flow; at runtime
   * prefer {@link addNode} so children sync to the client.
   */
  node(opts: FlowNodeProps, fn: () => void): Element {
    this.positions[opts.id] = clonePosition(opts.position);
    const panel = new Element('flowNode', {
      id: opts.id,
      position: clonePosition(opts.position),
      handles: opts.handles,
      className: opts.className,
    });
    withParent(panel, fn);
    return panel;
  }

  /** Append a node at runtime and push a `setChildren` patch. */
  addNode(opts: FlowNodeProps, fn: () => void): Element {
    const existing = this.findNode(opts.id);
    if (existing) {
      this.moveNode(opts.id, opts.position);
      if (opts.handles !== undefined) existing.update({ handles: opts.handles });
      if (opts.className !== undefined) existing.update({ className: opts.className });
      return existing;
    }
    const panel = withParent(this, () => this.node(opts, fn));
    this.syncChildren();
    return panel;
  }

  /** Remove a node, its position, and any incident edges. */
  removeNode(id: string): this {
    const idx = this.children.findIndex(
      (c) => c.type === 'flowNode' && String(c.props.id) === id,
    );
    if (idx < 0) {
      delete this.positions[id];
      return this;
    }
    const [child] = this.children.splice(idx, 1);
    child?.destroy();
    delete this.positions[id];
    const edges = this.getEdges();
    const nextEdges = edges.filter((e) => e.source !== id && e.target !== id);
    if (nextEdges.length !== edges.length) {
      this.setEdges(nextEdges);
    }
    this.syncChildren();
    return this;
  }

  private findNode(id: string): Element | undefined {
    return this.children.find(
      (c) => c.type === 'flowNode' && String(c.props.id) === id,
    );
  }

  private syncChildren(): void {
    const session = this.session;
    if (!session?.isMounted) return;
    session.enqueuePatch({
      op: 'setChildren',
      id: this.id,
      children: this.children.map((c) => c.toJSON()),
    });
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
