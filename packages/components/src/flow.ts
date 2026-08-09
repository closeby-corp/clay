import { Element, withParent } from '@badui/core';

export type FlowPosition = { x: number; y: number };

export type FlowHandlePosition = 'top' | 'right' | 'bottom' | 'left';

export type FlowHandle = {
  id: string;
  type: 'source' | 'target';
  position: FlowHandlePosition;
};

/** Built-in React Flow path kinds (no custom edgeTypes registry required). */
export type FlowEdgePathType =
  | 'default'
  | 'straight'
  | 'step'
  | 'smoothstep'
  | 'simplebezier';

/** Stroke / label color presets mapped on the client. */
export type FlowEdgeVariant = 'default' | 'primary' | 'muted' | 'destructive';

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  /** React Flow path type. Default: `'default'` (bezier). */
  type?: FlowEdgePathType;
  label?: string;
  animated?: boolean;
  variant?: FlowEdgeVariant;
};

export type FlowConnectPayload = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  /**
   * Client-generated edge id echoed so optimistic RF edges settle to the
   * same id the server stores (avoids brief id mismatch after connect).
   */
  id?: string;
};

export type FlowNodeMovePayload = {
  nodeId: string;
  position: FlowPosition;
};

export type FlowSelectionPayload = {
  nodeIds: string[];
  edgeIds: string[];
};

export type FlowLayoutDirection = 'LR' | 'TB';

export type FlowLayoutOptions = {
  /** Layer direction. Default `'LR'`. */
  direction?: FlowLayoutDirection;
  /** Estimated node box for packing. Defaults: 180×80. */
  nodeWidth?: number;
  nodeHeight?: number;
  /** Gap between layers (ranks). Default 80. */
  rankSep?: number;
  /** Gap between nodes in the same layer. Default 40. */
  nodeSep?: number;
  /** Origin offset. Default `{ x: 0, y: 0 }`. */
  origin?: FlowPosition;
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
  /** Applied to new edges from `connect` settle when the edge omits `type`. */
  defaultEdgeType?: FlowEdgePathType;
  /** Applied to new edges from `connect` settle when the edge omits `animated`. */
  defaultEdgeAnimated?: boolean;
  /** Applied to new edges from `connect` settle when the edge omits `variant`. */
  defaultEdgeVariant?: FlowEdgeVariant;
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
    type: edge.type,
    label: edge.label,
    animated: edge.animated,
    variant: edge.variant,
  };
}

function clonePosition(position: FlowPosition): FlowPosition {
  return { x: Number(position.x) || 0, y: Number(position.y) || 0 };
}

/** Stable-ish id used by client + server when connect does not supply one. */
export function makeFlowEdgeId(
  source: string,
  target: string,
  sourceHandle?: string | null,
  targetHandle?: string | null,
  unique?: string | number,
): string {
  const base = `e-${source}-${target}-${sourceHandle ?? ''}-${targetHandle ?? ''}`;
  return unique == null || unique === '' ? base : `${base}-${unique}`;
}

/**
 * Layered layout (no dagre): BFS ranks from roots, pack within each rank.
 * Pure helper for tests / callers that want positions without mutating a flow.
 */
export function computeFlowLayout(
  nodeIds: string[],
  edges: Array<Pick<FlowEdge, 'source' | 'target'>>,
  opts: FlowLayoutOptions = {},
): Record<string, FlowPosition> {
  const direction = opts.direction ?? 'LR';
  const nodeWidth = opts.nodeWidth ?? 180;
  const nodeHeight = opts.nodeHeight ?? 80;
  const rankSep = opts.rankSep ?? 80;
  const nodeSep = opts.nodeSep ?? 40;
  const origin = opts.origin ?? { x: 0, y: 0 };

  const ids = [...new Set(nodeIds.filter(Boolean))];
  const idSet = new Set(ids);
  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const id of ids) {
    outgoing.set(id, []);
    indegree.set(id, 0);
  }
  for (const e of edges) {
    if (!idSet.has(e.source) || !idSet.has(e.target) || e.source === e.target) continue;
    outgoing.get(e.source)!.push(e.target);
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
  }

  const rank = new Map<string, number>();
  const queue: string[] = [];
  for (const id of ids) {
    if ((indegree.get(id) ?? 0) === 0) {
      rank.set(id, 0);
      queue.push(id);
    }
  }
  // Isolated / cyclic leftovers start at rank 0.
  if (queue.length === 0 && ids.length > 0) {
    for (const id of ids) {
      rank.set(id, 0);
      queue.push(id);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++]!;
    const r = rank.get(cur) ?? 0;
    for (const next of outgoing.get(cur) ?? []) {
      const nextRank = Math.max(rank.get(next) ?? 0, r + 1);
      if (!rank.has(next) || nextRank > (rank.get(next) ?? 0)) {
        rank.set(next, nextRank);
      }
      if (!queue.includes(next)) queue.push(next);
    }
  }
  for (const id of ids) {
    if (!rank.has(id)) rank.set(id, 0);
  }

  const layers = new Map<number, string[]>();
  let maxRank = 0;
  for (const id of ids) {
    const r = rank.get(id) ?? 0;
    maxRank = Math.max(maxRank, r);
    const list = layers.get(r) ?? [];
    list.push(id);
    layers.set(r, list);
  }

  // Stable order within a layer: original nodeIds order.
  const orderIndex = new Map(ids.map((id, i) => [id, i]));
  for (const list of layers.values()) {
    list.sort((a, b) => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0));
  }

  const positions: Record<string, FlowPosition> = {};
  for (let r = 0; r <= maxRank; r++) {
    const list = layers.get(r) ?? [];
    const count = list.length;
    for (let i = 0; i < count; i++) {
      const id = list[i]!;
      if (direction === 'TB') {
        const layerWidth =
          count * nodeWidth + Math.max(0, count - 1) * nodeSep;
        const startX = origin.x - layerWidth / 2 + nodeWidth / 2;
        positions[id] = {
          x: startX + i * (nodeWidth + nodeSep),
          y: origin.y + r * (nodeHeight + rankSep),
        };
      } else {
        const layerHeight =
          count * nodeHeight + Math.max(0, count - 1) * nodeSep;
        const startY = origin.y - layerHeight / 2 + nodeHeight / 2;
        positions[id] = {
          x: origin.x + r * (nodeWidth + rankSep),
          y: startY + i * (nodeHeight + nodeSep),
        };
      }
    }
  }
  return positions;
}

/**
 * Interactive flow diagram. Owns edges + node positions (DataTable-style);
 * default settle handlers update that model before user callbacks run.
 * Prefer mutating via element APIs instead of wrapping the whole flow in `ui.auto`.
 */
export class FlowElement extends Element {
  /** Graph-id → last known position (seeded by `node` / `addNode` / `moveNode`). */
  private positions: Record<string, FlowPosition> = {};
  private edgeSeq = 0;

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
      defaultEdgeType,
      defaultEdgeAnimated,
      defaultEdgeVariant,
    } = props;

    super('flow', {
      edges: (edges ?? []).map(cloneEdge),
      fitView: fitView ?? true,
      showMiniMap: showMiniMap ?? true,
      showControls: showControls ?? true,
      className,
      defaultEdgeType,
      defaultEdgeAnimated,
      defaultEdgeVariant,
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
      this.edgeSeq += 1;
      const id =
        payload.id?.trim() ||
        makeFlowEdgeId(
          payload.source,
          payload.target,
          payload.sourceHandle,
          payload.targetHandle,
          `${Date.now()}-${this.edgeSeq}`,
        );
      const edge: FlowEdge = {
        id,
        source: payload.source,
        target: payload.target,
        sourceHandle: payload.sourceHandle ?? undefined,
        targetHandle: payload.targetHandle ?? undefined,
      };
      const defType = this.props.defaultEdgeType as FlowEdgePathType | undefined;
      const defAnimated = this.props.defaultEdgeAnimated as boolean | undefined;
      const defVariant = this.props.defaultEdgeVariant as FlowEdgeVariant | undefined;
      if (defType) edge.type = defType;
      if (defAnimated != null) edge.animated = defAnimated;
      if (defVariant) edge.variant = defVariant;
      this.addEdge(edge);
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

  /**
   * Auto-layout nodes with a simple layered algorithm (no dagre/elk).
   * Updates owned positions via {@link moveNode}.
   */
  layout(opts: FlowLayoutOptions = {}): this {
    const next = computeFlowLayout(this.getNodeIds(), this.getEdges(), opts);
    for (const [id, position] of Object.entries(next)) {
      this.moveNode(id, position);
    }
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
