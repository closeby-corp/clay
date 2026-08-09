import { graphlib, layout as dagreLayout } from '@dagrejs/dagre';
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

/** Built-in node chrome. Custom keys require client `registerFlowNodeTypes`. */
export type FlowNodeKind = 'default' | 'group';

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  /**
   * React Flow path type, or a custom edgeType registry key.
   * Built-ins: default / straight / step / smoothstep / simplebezier.
   * Default: `'default'` (bezier).
   */
  type?: FlowEdgePathType | (string & {});
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

export type FlowLayoutNodeMeta = {
  width?: number;
  height?: number;
  parentId?: string;
  kind?: FlowNodeKind;
};

export type FlowLayoutOptions = {
  /** Layer direction. Default `'LR'`. */
  direction?: FlowLayoutDirection;
  /** Estimated node box for packing. Defaults: 180×80 (groups: 360×220). */
  nodeWidth?: number;
  nodeHeight?: number;
  /** Gap between layers (ranks). Default 80. */
  rankSep?: number;
  /** Gap between nodes in the same layer. Default 40. */
  nodeSep?: number;
  /** Origin offset. Default `{ x: 0, y: 0 }`. */
  origin?: FlowPosition;
  /** Per-node size / parent overrides (used by `layout()` automatically). */
  nodes?: Record<string, FlowLayoutNodeMeta>;
};

export type FlowNodeProps = {
  /** Graph node id (used by edges / React Flow). */
  id: string;
  position: FlowPosition;
  handles?: FlowHandle[];
  className?: string;
  /**
   * RF `nodeTypes` key. Defaults to `'badui'`, or `'baduiGroup'` when
   * `kind: 'group'`. Custom keys need client `registerFlowNodeTypes`.
   */
  nodeType?: string;
  /** `'group'` → container node; children set `parentId` to this id. */
  kind?: FlowNodeKind;
  /**
   * Parent group id. Child positions are relative to the parent (RF parentId).
   * Drag is constrained to the parent by default (`extent: 'parent'`).
   */
  parentId?: string;
  /** Explicit size (especially useful for groups). */
  width?: number;
  height?: number;
  /**
   * RF extent. Default `'parent'` when `parentId` is set; pass `null` to allow
   * free dragging outside the group.
   */
  extent?: 'parent' | null;
};

export type FlowProps = {
  edges?: FlowEdge[];
  fitView?: boolean;
  showMiniMap?: boolean;
  showControls?: boolean;
  className?: string;
  /** Applied to new edges from `connect` settle when the edge omits `type`. */
  defaultEdgeType?: FlowEdgePathType | (string & {});
  /** Applied to new edges from `connect` settle when the edge omits `animated`. */
  defaultEdgeAnimated?: boolean;
  /** Applied to new edges from `connect` settle when the edge omits `variant`. */
  defaultEdgeVariant?: FlowEdgeVariant;
  /**
   * Custom RF nodeType keys referenced by this flow (documentation + client hint).
   * Components must be registered via client `registerFlowNodeTypes`.
   */
  customNodeTypes?: string[];
  /**
   * Custom RF edgeType keys referenced by this flow (documentation + client hint).
   * Components must be registered via client `registerFlowEdgeTypes`.
   */
  customEdgeTypes?: string[];
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

function resolveNodeType(opts: FlowNodeProps): string {
  if (opts.nodeType) return opts.nodeType;
  return opts.kind === 'group' ? 'baduiGroup' : 'badui';
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

type LayoutGraphInput = {
  nodeIds: string[];
  edges: Array<Pick<FlowEdge, 'source' | 'target'>>;
  direction: FlowLayoutDirection;
  defaultWidth: number;
  defaultHeight: number;
  rankSep: number;
  nodeSep: number;
  origin: FlowPosition;
  meta: Record<string, FlowLayoutNodeMeta>;
};

function runDagreLayout(input: LayoutGraphInput): Record<string, FlowPosition> {
  const {
    nodeIds,
    edges,
    direction,
    defaultWidth,
    defaultHeight,
    rankSep,
    nodeSep,
    origin,
    meta,
  } = input;

  const ids = [...new Set(nodeIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const idSet = new Set(ids);
  const g = new graphlib.Graph({ compound: false, directed: true, multigraph: false });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    edgesep: Math.max(20, Math.floor(nodeSep / 2)),
    marginx: 0,
    marginy: 0,
  });

  for (const id of ids) {
    const m = meta[id];
    const isGroup = m?.kind === 'group';
    const width = m?.width ?? (isGroup ? Math.max(defaultWidth, 360) : defaultWidth);
    const height = m?.height ?? (isGroup ? Math.max(defaultHeight, 220) : defaultHeight);
    g.setNode(id, { width, height });
  }

  const seenEdges = new Set<string>();
  for (const e of edges) {
    if (!idSet.has(e.source) || !idSet.has(e.target) || e.source === e.target) continue;
    const key = `${e.source}->${e.target}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    g.setEdge(e.source, e.target);
  }

  dagreLayout(g);

  const positions: Record<string, FlowPosition> = {};
  for (const id of ids) {
    const n = g.node(id) as { x?: number; y?: number; width?: number; height?: number } | undefined;
    if (!n || n.x == null || n.y == null) {
      positions[id] = { x: origin.x, y: origin.y };
      continue;
    }
    const w = n.width ?? defaultWidth;
    const h = n.height ?? defaultHeight;
    // dagre uses center coords; React Flow uses top-left.
    positions[id] = {
      x: origin.x + n.x - w / 2,
      y: origin.y + n.y - h / 2,
    };
  }
  return positions;
}

/**
 * Layered layout via `@dagrejs/dagre`. Top-level nodes are laid out as one
 * graph; children (`parentId`) are packed inside each parent with a nested
 * dagre pass (relative positions). Pure helper — does not mutate a flow.
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
  const meta = opts.nodes ?? {};

  const ids = [...new Set(nodeIds.filter(Boolean))];
  const idSet = new Set(ids);

  const childrenOf = new Map<string, string[]>();
  const topLevel: string[] = [];
  for (const id of ids) {
    const parentId = meta[id]?.parentId;
    if (parentId && idSet.has(parentId) && parentId !== id) {
      const list = childrenOf.get(parentId) ?? [];
      list.push(id);
      childrenOf.set(parentId, list);
    } else {
      topLevel.push(id);
    }
  }

  const topSet = new Set(topLevel);
  const topEdges = edges.filter(
    (e) => topSet.has(e.source) && topSet.has(e.target),
  );

  const positions = runDagreLayout({
    nodeIds: topLevel,
    edges: topEdges,
    direction,
    defaultWidth: nodeWidth,
    defaultHeight: nodeHeight,
    rankSep,
    nodeSep,
    origin,
    meta,
  });

  for (const [parentId, childIds] of childrenOf) {
    const childSet = new Set(childIds);
    const childEdges = edges.filter(
      (e) => childSet.has(e.source) && childSet.has(e.target),
    );
    const nested = runDagreLayout({
      nodeIds: childIds,
      edges: childEdges,
      direction,
      defaultWidth: Math.max(80, Math.floor(nodeWidth * 0.7)),
      defaultHeight: Math.max(40, Math.floor(nodeHeight * 0.7)),
      rankSep: Math.max(24, Math.floor(rankSep / 2)),
      nodeSep: Math.max(16, Math.floor(nodeSep / 2)),
      // Padding inside the group so children clear the group chrome.
      origin: { x: 16, y: 40 },
      meta,
    });
    for (const [id, pos] of Object.entries(nested)) {
      positions[id] = pos;
    }
    // Ensure parent exists even if it was only referenced via parentId.
    if (!positions[parentId] && idSet.has(parentId)) {
      // Already handled in topLevel when parent is in ids; no-op otherwise.
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
      customNodeTypes,
      customEdgeTypes,
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
      customNodeTypes,
      customEdgeTypes,
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
      const defType = this.props.defaultEdgeType as FlowEdge['type'] | undefined;
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
   * Auto-layout nodes with dagre (`@dagrejs/dagre`).
   * Updates owned positions via {@link moveNode}. Child nodes (`parentId`)
   * get relative positions packed inside their group.
   */
  layout(opts: FlowLayoutOptions = {}): this {
    const meta: Record<string, FlowLayoutNodeMeta> = { ...(opts.nodes ?? {}) };
    for (const child of this.children) {
      if (child.type !== 'flowNode') continue;
      const id = String(child.props.id ?? '');
      if (!id) continue;
      meta[id] = {
        width: child.props.width as number | undefined,
        height: child.props.height as number | undefined,
        parentId: child.props.parentId as string | undefined,
        kind: child.props.kind as FlowNodeKind | undefined,
        ...meta[id],
      };
    }
    const next = computeFlowLayout(this.getNodeIds(), this.getEdges(), {
      ...opts,
      nodes: meta,
    });
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
      nodeType: resolveNodeType(opts),
      kind: opts.kind ?? 'default',
      parentId: opts.parentId,
      width: opts.width,
      height: opts.height,
      extent: opts.extent === undefined ? undefined : opts.extent,
    });
    withParent(panel, fn);
    return panel;
  }

  /**
   * Convenience for a group/container node (`kind: 'group'`, default size 400×280).
   * Nested editing as a separate canvas is deferred — children use `parentId`.
   */
  group(
    opts: Omit<FlowNodeProps, 'kind'> & { width?: number; height?: number },
    fn: () => void,
  ): Element {
    return this.node(
      {
        ...opts,
        kind: 'group',
        width: opts.width ?? 400,
        height: opts.height ?? 280,
      },
      fn,
    );
  }

  /** Append a node at runtime and push a `setChildren` patch. */
  addNode(opts: FlowNodeProps, fn: () => void): Element {
    const existing = this.findNode(opts.id);
    if (existing) {
      this.moveNode(opts.id, opts.position);
      if (opts.handles !== undefined) existing.update({ handles: opts.handles });
      if (opts.className !== undefined) existing.update({ className: opts.className });
      if (opts.nodeType !== undefined || opts.kind !== undefined) {
        existing.update({ nodeType: resolveNodeType(opts) });
      }
      if (opts.kind !== undefined) existing.update({ kind: opts.kind });
      if (opts.parentId !== undefined) existing.update({ parentId: opts.parentId });
      if (opts.width !== undefined) existing.update({ width: opts.width });
      if (opts.height !== undefined) existing.update({ height: opts.height });
      if (opts.extent !== undefined) existing.update({ extent: opts.extent });
      return existing;
    }
    const panel = withParent(this, () => this.node(opts, fn));
    this.syncChildren();
    return panel;
  }

  /** Append a group node at runtime. */
  addGroup(
    opts: Omit<FlowNodeProps, 'kind'> & { width?: number; height?: number },
    fn: () => void,
  ): Element {
    return this.addNode(
      {
        ...opts,
        kind: 'group',
        width: opts.width ?? 400,
        height: opts.height ?? 280,
      },
      fn,
    );
  }

  /**
   * Remove a node, its position, incident edges, and any children that list
   * this node as `parentId` (group cleanup).
   */
  removeNode(id: string): this {
    const childIds = this.children
      .filter(
        (c) =>
          c.type === 'flowNode' &&
          String(c.props.parentId ?? '') === id &&
          String(c.props.id) !== id,
      )
      .map((c) => String(c.props.id));
    for (const childId of childIds) {
      this.removeNode(childId);
    }

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
