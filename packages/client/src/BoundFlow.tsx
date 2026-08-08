import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Background,
  Controls,
  Handle,
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

type FlowEdgeProp = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

type BaduiNodeData = {
  handles?: FlowHandle[];
  body: ElementNode[];
  className?: string;
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

function edgesKey(edges: FlowEdgeProp[]): string {
  return edges
    .map((e) => `${e.id}:${e.source}:${e.target}:${e.sourceHandle ?? ''}:${e.targetHandle ?? ''}`)
    .join('|');
}

function nodesStructureKey(flowNodes: ElementNode[]): string {
  return flowNodes
    .map((n) => {
      const handles = (n.props.handles as FlowHandle[] | undefined) ?? [];
      const handleKey = handles.map((h) => `${h.id}:${h.type}:${h.position}`).join(',');
      const bodyKey = n.children.map((c) => c.id).join(',');
      return `${String(n.props.id)}@${positionKey(n.props.position as { x: number; y: number })}#${handleKey}#${bodyKey}`;
    })
    .join('|');
}

function toRfEdge(e: FlowEdgeProp): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  };
}

function toRfNode(flowNode: ElementNode, emit: Emit, renderNode: RenderNode): Node<BaduiNodeData> {
  const pos = (flowNode.props.position as { x: number; y: number } | undefined) ?? { x: 0, y: 0 };
  return {
    id: String(flowNode.props.id ?? flowNode.id),
    type: 'badui',
    position: { x: Number(pos.x) || 0, y: Number(pos.y) || 0 },
    data: {
      handles: flowNode.props.handles as FlowHandle[] | undefined,
      body: flowNode.children,
      className: flowNode.props.className as string | undefined,
      emit,
      renderNode,
    },
  };
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

const nodeTypes = { badui: BaduiFlowNode };

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
  const flowNodes = useMemo(
    () => children.filter((c) => c.type === 'flowNode'),
    [children],
  );
  const serverEdges = (props.edges as FlowEdgeProp[] | undefined) ?? [];
  const fitView = props.fitView !== false;
  const showMiniMap = props.showMiniMap !== false;
  const showControls = props.showControls !== false;

  const structureKey = nodesStructureKey(flowNodes);
  const edgeKey = edgesKey(serverEdges);
  const draggingRef = useRef(false);
  const flowNodesRef = useRef(flowNodes);
  const emitRef = useRef(emit);
  const renderNodeRef = useRef(renderNode);
  flowNodesRef.current = flowNodes;
  emitRef.current = emit;
  renderNodeRef.current = renderNode;

  const [nodes, setNodes] = useState<Node<BaduiNodeData>[]>(() =>
    flowNodes.map((n) => toRfNode(n, emit, renderNode)),
  );
  const [edges, setEdges] = useState<Edge[]>(() => serverEdges.map(toRfEdge));

  // Reconcile topology / positions from server (skip mid-drag).
  // Do not depend on emit/renderNode identity — parent passes new lambdas every render.
  useEffect(() => {
    if (draggingRef.current) return;
    setNodes(
      flowNodesRef.current.map((n) =>
        toRfNode(n, emitRef.current, renderNodeRef.current),
      ),
    );
  }, [structureKey]);

  useEffect(() => {
    if (draggingRef.current) return;
    setEdges(serverEdges.map(toRfEdge));
  }, [edgeKey, serverEdges]);

  // Merge live BadUI bodies into RF nodes each render so nested prop patches
  // (e.g. progress value) show up without requiring a node drag / structure change.
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
      const payload = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      };
      const edgeId = `e-${connection.source}-${connection.target}-${connection.sourceHandle ?? ''}-${connection.targetHandle ?? ''}-${Date.now()}`;
      setEdges((eds) => [
        ...eds,
        {
          id: edgeId,
          source: connection.source!,
          target: connection.target!,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
        },
      ]);
      if (hasEvent(props, 'connect')) emit(id, 'connect', payload);
    },
    [emit, id, props],
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
