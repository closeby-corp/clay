import { ui } from '@badui/ui';
import type { FlowConnectPayload, FlowEdge, FlowNodeMovePayload, FlowPosition } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Flow',
  icon: 'workflow',
  order: 92,
};

type Positions = Record<string, FlowPosition>;

const INITIAL_POSITIONS: Positions = {
  fetch: { x: 0, y: 40 },
  transform: { x: 280, y: 40 },
  load: { x: 560, y: 40 },
};

const INITIAL_EDGES: FlowEdge[] = [
  { id: 'e-fetch-transform', source: 'fetch', target: 'transform', sourceHandle: 'out', targetHandle: 'in' },
];

ui.page('/examples/flow', () => {
  const diagram = ui.state({
    edges: INITIAL_EDGES.map((e) => ({ ...e })),
    positions: { ...INITIAL_POSITIONS } as Positions,
    runs: 0,
    lastEvent: '' as string,
  });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.flow — React Flow graph; node bodies are live BadUI trees (labels/buttons); connect/drag emit coarse WS events.',
        );

        exampleSection(
          'Pipeline',
          'Drag nodes, connect handles, click Run inside a node. Positions/edges are server-owned after settle events.',
        );

        ui.auto(() => {
          ui.flow(
            {
              edges: diagram.edges,
              fitView: true,
              showMiniMap: true,
              showControls: true,
              onConnect: (payload: FlowConnectPayload) => {
                const id = `e-${payload.source}-${payload.target}-${Date.now()}`;
                diagram.edges = [
                  ...diagram.edges,
                  {
                    id,
                    source: payload.source,
                    target: payload.target,
                    sourceHandle: payload.sourceHandle ?? undefined,
                    targetHandle: payload.targetHandle ?? undefined,
                  },
                ];
                diagram.lastEvent = `connect ${payload.source} → ${payload.target}`;
              },
              onNodeMove: (payload: FlowNodeMovePayload) => {
                diagram.positions = {
                  ...diagram.positions,
                  [payload.nodeId]: payload.position,
                };
                diagram.lastEvent = `move ${payload.nodeId} → (${Math.round(payload.position.x)}, ${Math.round(payload.position.y)})`;
              },
              onEdgesDelete: (ids) => {
                diagram.edges = diagram.edges.filter((e) => !ids.includes(e.id));
                diagram.lastEvent = `edgesDelete ${ids.join(',')}`;
              },
              onNodesDelete: (ids) => {
                diagram.edges = diagram.edges.filter(
                  (e) => !ids.includes(e.source) && !ids.includes(e.target),
                );
                diagram.lastEvent = `nodesDelete ${ids.join(',')}`;
              },
              onSelectionChange: (payload) => {
                diagram.lastEvent = `selection nodes=${payload.nodeIds.join(',') || '—'} edges=${payload.edgeIds.join(',') || '—'}`;
              },
            },
            (flow) => {
              flow.node(
                {
                  id: 'fetch',
                  position: diagram.positions.fetch,
                  handles: [
                    { id: 'out', type: 'source', position: 'right' },
                  ],
                },
                () => {
                  ui.label('Fetch').classes('text-sm font-medium');
                  ui.label('Pull upstream data').classes('text-xs text-muted-foreground');
                  ui.button('Run', {
                    size: 'sm',
                    onClick: () => {
                      diagram.runs += 1;
                      ui.notify(`Fetch run #${diagram.runs}`, 'success');
                    },
                  });
                },
              );

              flow.node(
                {
                  id: 'transform',
                  position: diagram.positions.transform,
                  handles: [
                    { id: 'in', type: 'target', position: 'left' },
                    { id: 'out', type: 'source', position: 'right' },
                  ],
                },
                () => {
                  ui.label('Transform').classes('text-sm font-medium');
                  ui.label('Map + validate').classes('text-xs text-muted-foreground');
                },
              );

              flow.node(
                {
                  id: 'load',
                  position: diagram.positions.load,
                  handles: [{ id: 'in', type: 'target', position: 'left' }],
                },
                () => {
                  ui.label('Load').classes('text-sm font-medium');
                  ui.label('Write destination').classes('text-xs text-muted-foreground');
                  ui.button('Notify', {
                    size: 'sm',
                    variant: 'outline',
                    onClick: () => ui.notify('Load complete', 'info'),
                  });
                },
              );
            },
          );
        });

        ui.auto(() => {
          ui.label(diagram.lastEvent ? `Last event: ${diagram.lastEvent}` : 'Last event: —').classes(
            'text-sm text-muted-foreground',
          );
          ui.label(`Fetch runs: ${diagram.runs}`).classes('text-sm text-muted-foreground');
        });

        ui.button('Reset diagram', {
          variant: 'outline',
          onClick: () => {
            diagram.edges = INITIAL_EDGES.map((e) => ({ ...e }));
            diagram.positions = { ...INITIAL_POSITIONS };
            diagram.runs = 0;
            diagram.lastEvent = '';
            ui.notify('Diagram reset', 'info');
          },
        });
      },
      { gap: 6 },
    );
  });
});
