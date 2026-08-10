import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useUpdateNodeInternals,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import type { ElementNode } from './protocol';
import { cn } from '@/lib/utils';

type Emit = (id: string, type: string, value?: unknown) => void;
type RenderNode = (node: ElementNode, emit: Emit) => ReactNode;

type FlowHandle = {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'right' | 'bottom' | 'left';
};

type FlowEdgePathType =
  | 'default'
  | 'straight'
  | 'step'
  | 'smoothstep'
  | 'simplebezier';

type FlowEdgeVariant = 'default' | 'primary' | 'muted' | 'destructive';

type FlowEdgeProp = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
  animated?: boolean;
  variant?: FlowEdgeVariant;
};

type BaduiNodeData = {
  handles?: FlowHandle[];
  body: ElementNode[];
  className?: string;
  kind?: string;
  width?: number;
  height?: number;
  emit: Emit;
  renderNode: RenderNode;
};

const HANDLE_POSITION: Record<FlowHandle['position'], Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

const DEFAULT_HANDLES: FlowHandle[] = [
  { id: 'target', type: 'target', position: 'left' },
  { id: 'source', type: 'source', position: 'right' },
];

const EDGE_VARIANT_STYLE: Record<
  Exclude<FlowEdgeVariant, 'default'>,
  { stroke: string; labelColor: string }
> = {
  primary: {
    stroke: 'var(--primary)',
    labelColor: 'var(--primary)',
  },
  muted: {
    stroke: 'var(--muted-foreground)',
    labelColor: 'var(--muted-foreground)',
  },
  destructive: {
    stroke: 'var(--destructive)',
    labelColor: 'var(--destructive)',
  },
};

/** App-registered RF node types (merged with built-in `clay` / `clayGroup`). */
const registeredNodeTypes: Record<string, ComponentType<NodeProps>> = {};
/** App-registered RF edge types (merged into React Flow `edgeTypes`). */
const registeredEdgeTypes: Record<string, ComponentType<EdgeProps>> = {};

/**
 * Register custom React Flow node types for Clay flows.
 * Use the same string keys via `flow.node({ nodeType: '…' })`.
 * Intended for custom client builds that import BoundFlow.
 */
export function registerFlowNodeTypes(
  types: Record<string, ComponentType<NodeProps>>,
): void {
  Object.assign(registeredNodeTypes, types);
}

/**
 * Register custom React Flow edge types for Clay flows.
 * Use the same string keys via edge `type: '…'` (non-built-in path kinds).
 */
export function registerFlowEdgeTypes(
  types: Record<string, ComponentType<EdgeProps>>,
): void {
  Object.assign(registeredEdgeTypes, types);
}

/** Test helper — clear app-registered types. */
export function clearFlowTypeRegistries(): void {
  for (const key of Object.keys(registeredNodeTypes)) delete registeredNodeTypes[key];
  for (const key of Object.keys(registeredEdgeTypes)) delete registeredEdgeTypes[key];
}

export function getRegisteredFlowNodeTypes(): Record<string, ComponentType<NodeProps>> {
  return { ...registeredNodeTypes };
}

export function getRegisteredFlowEdgeTypes(): Record<string, ComponentType<EdgeProps>> {
  return { ...registeredEdgeTypes };
}

function asStyle(style: unknown): CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === 'string') {
    const out: Record<string, string> = {};
    for (const part of style.split(';')) {
      const [key, ...rest] = part.split(':');
      if (!key || rest.length === 0) continue;
      out[key.trim()] = rest.join(':').trim();
    }
    return out as CSSProperties;
  }
  return style as CSSProperties;
}

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

function positionKey(pos: { x: number; y: number } | undefined): string {
  if (!pos) return '';
  return `${pos.x},${pos.y}`;
}

function connectionKey(e: {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}): string {
  return `${e.source}|${e.target}|${e.sourceHandle ?? ''}|${e.targetHandle ?? ''}`;
}

function edgesKey(edges: FlowEdgeProp[]): string {
  return edges
    .map(
      (e) =>
        `${e.id}:${e.source}:${e.target}:${e.sourceHandle ?? ''}:${e.targetHandle ?? ''}:${e.type ?? ''}:${e.label ?? ''}:${e.animated ? 1 : 0}:${e.variant ?? ''}`,
    )
    .join('|');
}

/** Graph identity + handles + body + parent/group — positions intentionally omitted. */
function nodesTopologyKey(flowNodes: ElementNode[]): string {
  return flowNodes
    .map((n) => {
      const handles = (n.props.handles as FlowHandle[] | undefined) ?? [];
      const handleKey = handles.map((h) => `${h.id}:${h.type}:${h.position}`).join(',');
      const bodyKey = n.children.map((c) => c.id).join(',');
      return [
        String(n.props.id),
        String(n.props.nodeType ?? ''),
        String(n.props.kind ?? ''),
        String(n.props.parentId ?? ''),
        String(n.props.width ?? ''),
        String(n.props.height ?? ''),
        String(n.props.extent ?? ''),
        handleKey,
        bodyKey,
      ].join('#');
    })
    .join('|');
}

function nodesPositionsKey(flowNodes: ElementNode[]): string {
  return flowNodes
    .map((n) => `${String(n.props.id)}@${positionKey(n.props.position as { x: number; y: number })}`)
    .join('|');
}

function toRfEdge(e: FlowEdgeProp, prev?: Edge): Edge {
  const variant = e.variant && e.variant !== 'default' ? e.variant : undefined;
  const colors = variant ? EDGE_VARIANT_STYLE[variant] : undefined;
  const type = e.type && e.type !== 'default' ? e.type : undefined;
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type,
    label: e.label,
    animated: e.animated,
    selected: prev?.selected,
    style: colors ? { stroke: colors.stroke } : undefined,
    labelStyle: colors ? { fill: colors.labelColor, fontWeight: 500 } : undefined,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: colors?.stroke,
    },
  };
}

/**
 * Reconcile server edges onto local RF edges.
 * Prefer id match; if the server id differs from an optimistic connect id,
 * rematch by source/target/handles and adopt the server id (keep selection).
 */
export function reconcileFlowEdges(serverEdges: FlowEdgeProp[], prev: Edge[]): Edge[] {
  const prevById = new Map(prev.map((e) => [e.id, e]));
  const prevByConn = new Map<string, Edge>();
  for (const e of prev) {
    const k = connectionKey(e);
    if (!prevByConn.has(k)) prevByConn.set(k, e);
  }
  const claimed = new Set<string>();

  return serverEdges.map((e) => {
    const byId = prevById.get(e.id);
    if (byId) {
      claimed.add(byId.id);
      return toRfEdge(e, byId);
    }
    const byConn = prevByConn.get(connectionKey(e));
    if (byConn && !claimed.has(byConn.id) && byConn.id !== e.id) {
      claimed.add(byConn.id);
      return toRfEdge(e, byConn);
    }
    return toRfEdge(e);
  });
}

function toRfNode(flowNode: ElementNode, emit: Emit, renderNode: RenderNode): Node<BaduiNodeData> {
  const pos = (flowNode.props.position as { x: number; y: number } | undefined) ?? { x: 0, y: 0 };
  const kind = (flowNode.props.kind as string | undefined) ?? 'default';
  const nodeType =
    (flowNode.props.nodeType as string | undefined) ||
    (kind === 'group' ? 'clayGroup' : 'clay');
  const parentId = flowNode.props.parentId as string | undefined;
  const width = flowNode.props.width as number | undefined;
  const height = flowNode.props.height as number | undefined;
  const extentProp = flowNode.props.extent as 'parent' | null | undefined;
  const extent =
    extentProp === null
      ? undefined
      : extentProp === 'parent'
        ? 'parent'
        : parentId
          ? 'parent'
          : undefined;

  const node: Node<BaduiNodeData> = {
    id: String(flowNode.props.id ?? flowNode.id),
    type: nodeType,
    position: { x: Number(pos.x) || 0, y: Number(pos.y) || 0 },
    data: {
      handles: flowNode.props.handles as FlowHandle[] | undefined,
      body: flowNode.children,
      className: flowNode.props.className as string | undefined,
      kind,
      width,
      height,
      emit,
      renderNode,
    },
  };
  if (parentId) node.parentId = parentId;
  if (extent) node.extent = extent;
  if (width != null || height != null) {
    node.style = {
      ...(width != null ? { width } : null),
      ...(height != null ? { height } : null),
    };
  }
  // Groups sit under children in the stacking sense (RF draws parents first when zIndex lower).
  if (kind === 'group') {
    node.zIndex = -1;
  }
  return node;
}

const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, a, [role="button"], [contenteditable="true"], [data-slot="slider"]';

function BaduiFlowNode({ id, data }: NodeProps<Node<BaduiNodeData>>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const rootRef = useRef<HTMLDivElement>(null);
  const handles = data.handles?.length ? data.handles : DEFAULT_HANDLES;
  const bodyKey = data.body.map((c) => c.id).join(',');

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, bodyKey, handles, updateNodeInternals]);

  // Mark interactive controls as nodrag/nopan so the card chrome stays draggable.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
      el.classList.add('nodrag', 'nopan');
    });
  }, [bodyKey, data.body]);

  return (
    <div
      ref={rootRef}
      className={cn(
        'min-w-[10rem] cursor-grab rounded-md border bg-card text-card-foreground shadow-sm active:cursor-grabbing',
        data.className,
      )}
      data-slot="flow-node"
    >
      {handles.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type={h.type}
          position={HANDLE_POSITION[h.position] ?? Position.Right}
          className="!size-2.5 !border-2 !border-background !bg-primary"
        />
      ))}
      <div className="nowheel flex flex-col gap-2 p-3">
        {data.body.map((child) => (
          <div key={child.id}>{data.renderNode(child, data.emit)}</div>
        ))}
      </div>
    </div>
  );
}

/** Built-in group / subflow container (parent for `parentId` children). */
function BaduiGroupNode({ id, data }: NodeProps<Node<BaduiNodeData>>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const rootRef = useRef<HTMLDivElement>(null);
  const handles = data.handles ?? [];
  const bodyKey = data.body.map((c) => c.id).join(',');
  const width = data.width ?? 400;
  const height = data.height ?? 280;

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, bodyKey, handles, width, height, updateNodeInternals]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
      el.classList.add('nodrag', 'nopan');
    });
  }, [bodyKey, data.body]);

  return (
    <div
      ref={rootRef}
      className={cn(
        'h-full w-full cursor-grab rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/30 text-card-foreground active:cursor-grabbing',
        data.className,
      )}
      style={{ width, height, minWidth: width, minHeight: height }}
      data-slot="flow-group"
    >
      {handles.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type={h.type}
          position={HANDLE_POSITION[h.position] ?? Position.Right}
          className="!size-2.5 !border-2 !border-background !bg-primary"
        />
      ))}
      <div className="nowheel flex flex-col gap-1 p-2">
        {data.body.map((child) => (
          <div key={child.id}>{data.renderNode(child, data.emit)}</div>
        ))}
      </div>
    </div>
  );
}

const builtinNodeTypes = {
  clay: BaduiFlowNode,
  clayGroup: BaduiGroupNode,
};

/**
 * Optional labeled edge that apps can register under a custom key, or use as a
 * reference implementation when building custom edgeTypes.
 */
export function BaduiLabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  labelStyle,
  data,
}: EdgeProps) {
  const pathKind = (data as { path?: FlowEdgePathType } | undefined)?.path ?? 'smoothstep';
  const [edgePath, labelX, labelY] =
    pathKind === 'straight'
      ? getStraightPath({ sourceX, sourceY, targetX, targetY })
      : pathKind === 'default' || pathKind === 'simplebezier'
        ? getBezierPath({
            sourceX,
            sourceY,
            targetX,
            targetY,
            sourcePosition,
            targetPosition,
          })
        : getSmoothStepPath({
            sourceX,
            sourceY,
            targetX,
            targetY,
            sourcePosition,
            targetPosition,
          });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute text-[10px] font-medium"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              ...(labelStyle as CSSProperties | undefined),
            }}
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function BoundFlowInner({
  id,
  props,
  className,
  style,
  emit,
  children,
  renderNode,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
  children: ElementNode[];
  renderNode: RenderNode;
}) {
  const flowNodes = useMemo(() => {
    const list = children.filter((c) => c.type === 'flowNode');
    // Parents before children so RF can resolve parentId on first paint.
    return [...list].sort((a, b) => {
      const aParent = a.props.parentId ? 1 : 0;
      const bParent = b.props.parentId ? 1 : 0;
      return aParent - bParent;
    });
  }, [children]);
  const serverEdges = (props.edges as FlowEdgeProp[] | undefined) ?? [];
  const fitView = props.fitView !== false;
  const showMiniMap = props.showMiniMap !== false;
  const showControls = props.showControls !== false;
  const defaultEdgeType = props.defaultEdgeType as string | undefined;
  const defaultEdgeAnimated = props.defaultEdgeAnimated as boolean | undefined;
  const defaultEdgeVariant = props.defaultEdgeVariant as FlowEdgeVariant | undefined;

  const topologyKey = nodesTopologyKey(flowNodes);
  const positionsKey = nodesPositionsKey(flowNodes);
  const edgeKey = edgesKey(serverEdges);
  const draggingRef = useRef(false);
  const flowNodesRef = useRef(flowNodes);
  const emitRef = useRef(emit);
  const renderNodeRef = useRef(renderNode);
  const edgeSeqRef = useRef(0);
  flowNodesRef.current = flowNodes;
  emitRef.current = emit;
  renderNodeRef.current = renderNode;

  const registeredNodeKeys = Object.keys(registeredNodeTypes).join(',');
  const registeredEdgeKeys = Object.keys(registeredEdgeTypes).join(',');

  const nodeTypes = useMemo(
    () => ({ ...builtinNodeTypes, ...registeredNodeTypes }),
    [registeredNodeKeys],
  );

  const edgeTypes = useMemo(() => {
    if (!registeredEdgeKeys) return undefined;
    return { ...registeredEdgeTypes };
  }, [registeredEdgeKeys]);

  const [nodes, setNodes] = useState<Node<BaduiNodeData>[]>(() =>
    flowNodes.map((n) => toRfNode(n, emit, renderNode)),
  );
  const [edges, setEdges] = useState<Edge[]>(() => serverEdges.map((e) => toRfEdge(e)));

  // Topology change (ids / handles / body ids / parent) → rebuild RF nodes from server.
  useEffect(() => {
    if (draggingRef.current) return;
    setNodes(
      flowNodesRef.current.map((n) =>
        toRfNode(n, emitRef.current, renderNodeRef.current),
      ),
    );
  }, [topologyKey]);

  // Position-only patches: update matching RF nodes without remounting.
  useEffect(() => {
    if (draggingRef.current) return;
    setNodes((nds) => {
      const byId = new Map(
        flowNodesRef.current.map((n) => [String(n.props.id ?? n.id), n]),
      );
      let changed = false;
      const next = nds.map((node) => {
        const src = byId.get(node.id);
        if (!src) return node;
        const pos = (src.props.position as { x: number; y: number } | undefined) ?? {
          x: 0,
          y: 0,
        };
        const x = Number(pos.x) || 0;
        const y = Number(pos.y) || 0;
        if (node.position.x === x && node.position.y === y) return node;
        changed = true;
        return { ...node, position: { x, y } };
      });
      return changed ? next : nds;
    });
  }, [positionsKey]);

  // Reconcile edges by id (or connection topology when optimistic id differs).
  useEffect(() => {
    if (draggingRef.current) return;
    setEdges((prev) => reconcileFlowEdges(serverEdges, prev));
  }, [edgeKey, serverEdges]);

  // Merge live Clay bodies into RF nodes each render so nested prop patches
  // (e.g. progress value) show up without requiring a node drag / topology change.
  const displayNodes = useMemo(() => {
    const byId = new Map(flowNodes.map((n) => [String(n.props.id ?? n.id), n]));
    return nodes.map((node) => {
      const src = byId.get(node.id);
      if (!src) return node;
      return {
        ...node,
        data: {
          handles: src.props.handles as FlowHandle[] | undefined,
          body: src.children,
          className: src.props.className as string | undefined,
          kind: (src.props.kind as string | undefined) ?? 'default',
          width: src.props.width as number | undefined,
          height: src.props.height as number | undefined,
          emit: emitRef.current,
          renderNode: renderNodeRef.current,
        },
      };
    });
  }, [nodes, flowNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<BaduiNodeData>>[]) => {
      const structural = changes.some((c) => c.type === 'remove');
      setNodes((nds) => applyNodeChanges(changes, nds));
      if (structural && hasEvent(props, 'nodesDelete')) {
        const removed = changes
          .filter((c): c is NodeChange & { type: 'remove'; id: string } => c.type === 'remove')
          .map((c) => c.id);
        if (removed.length) emit(id, 'nodesDelete', removed);
      }
    },
    [emit, id, props],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const structural = changes.some((c) => c.type === 'remove');
      setEdges((eds) => applyEdgeChanges(changes, eds));
      if (structural && hasEvent(props, 'edgesDelete')) {
        const removed = changes
          .filter((c): c is EdgeChange & { type: 'remove'; id: string } => c.type === 'remove')
          .map((c) => c.id);
        if (removed.length) emit(id, 'edgesDelete', removed);
      }
    },
    [emit, id, props],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      edgeSeqRef.current += 1;
      const edgeId = `e-${connection.source}-${connection.target}-${connection.sourceHandle ?? ''}-${connection.targetHandle ?? ''}-${Date.now()}-${edgeSeqRef.current}`;
      const payload = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      };
      const optimistic: FlowEdgeProp = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      };
      if (defaultEdgeType) optimistic.type = defaultEdgeType;
      if (defaultEdgeAnimated != null) optimistic.animated = defaultEdgeAnimated;
      if (defaultEdgeVariant) optimistic.variant = defaultEdgeVariant;
      setEdges((eds) => [...eds, toRfEdge(optimistic)]);
      if (hasEvent(props, 'connect')) emit(id, 'connect', payload);
    },
    [defaultEdgeAnimated, defaultEdgeType, defaultEdgeVariant, emit, id, props],
  );

  const onNodeDragStart = useCallback(() => {
    draggingRef.current = true;
  }, []);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      draggingRef.current = false;
      if (hasEvent(props, 'nodeMove')) {
        emit(id, 'nodeMove', {
          nodeId: node.id,
          position: { x: node.position.x, y: node.position.y },
        });
      }
    },
    [emit, id, props],
  );

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      if (!hasEvent(props, 'selectionChange')) return;
      emit(id, 'selectionChange', {
        nodeIds: params.nodes.map((n) => n.id),
        edgeIds: params.edges.map((e) => e.id),
      });
    },
    [emit, id, props],
  );

  return (
    <div
      className={cn('h-[28rem] w-full overflow-hidden rounded-md border bg-background', className)}
      style={asStyle(style)}
      data-slot="flow"
    >
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        fitView={fitView}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        {showControls ? <Controls /> : null}
        {showMiniMap ? <MiniMap pannable zoomable /> : null}
      </ReactFlow>
    </div>
  );
}

export function BoundFlow(props: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
  children: ElementNode[];
  renderNode: RenderNode;
}) {
  return (
    <ReactFlowProvider>
      <BoundFlowInner {...props} />
    </ReactFlowProvider>
  );
}
