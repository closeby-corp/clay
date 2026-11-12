import { ui } from '@close-by/clay';
import type { FlowEdge, FlowPosition } from '@close-by/clay';
import { exampleHeader, exampleSection } from '../chrome';
import { cloneEdges, restorePositions, flowNodeText } from './_flow-shared';

export const pageMeta = {
  label: 'Flow editing',
  icon: 'workflow',
  order: 66,
  group: 'Apps',
  groupIcon: 'app-window',
};

const GRAPH_POSITIONS: Record<string, FlowPosition> = {
  sourceA: { x: 0, y: 40 },
  sourceB: { x: 0, y: 200 },
  merge: { x: 280, y: 120 },
  outOk: { x: 560, y: 40 },
  outErr: { x: 560, y: 200 },
};

const GRAPH_EDGES: FlowEdge[] = [
  {
    id: 'e-a-merge',
    source: 'sourceA',
    target: 'merge',
    sourceHandle: 'out',
    targetHandle: 'a',
  },
  {
    id: 'e-b-merge',
    source: 'sourceB',
    target: 'merge',
    sourceHandle: 'out',
    targetHandle: 'b',
  },
  {
    id: 'e-merge-ok',
    source: 'merge',
    target: 'outOk',
    sourceHandle: 'ok',
    targetHandle: 'in',
  },
];

const STATIC_GRAPH_IDS = new Set(Object.keys(GRAPH_POSITIONS));

ui.page('/examples/flow-editing', () => {
  const shared = ui.state({ lastEvent: '' as string });
  const graph = ui.state({
    stageCounter: 0,
    dynamicCount: 0,
  });

  ui.container({ centered: true, width: '2xl' }, () => {
    ui.column(() => {
      exampleHeader(undefined, 'Edit flow graphs with fan-in/out handles, dynamic stages, and parent groups.');
      ui.auto(() => {
        ui.label(shared.lastEvent ? `Last event: ${shared.lastEvent}` : 'Last event: —')
          .classes('text-sm text-muted-foreground');
      });
      exampleSection(
        '1. Fan-in / fan-out + dynamic stages',
        'Merge node has two target handles (a/b) and dual sources (ok/err). Add Stage uses flow.addNode — no outer ui.auto around the diagram.',
      );

      const graphFlow = ui.flow(
        {
          edges: cloneEdges(GRAPH_EDGES),
          fitView: true,
          showMiniMap: true,
          showControls: true,
          onConnect: (payload) => {
            shared.lastEvent = `[graph] connect ${payload.source} → ${payload.target}`;
          },
          onNodeMove: (payload) => {
            shared.lastEvent = `[graph] move ${payload.nodeId} → (${Math.round(payload.position.x)}, ${Math.round(payload.position.y)})`;
          },
          onEdgesDelete: (ids) => {
            shared.lastEvent = `[graph] edgesDelete ${ids.join(',')}`;
          },
          onNodesDelete: (ids) => {
            const removedDynamic = ids.filter((id) => !STATIC_GRAPH_IDS.has(id));
            if (removedDynamic.length) {
              graph.dynamicCount = Math.max(0, graph.dynamicCount - removedDynamic.length);
            }
            shared.lastEvent = `[graph] nodesDelete ${ids.join(',')}`;
          },
        },
        (flow) => {
          flow.node(
            {
              id: 'sourceA',
              position: GRAPH_POSITIONS.sourceA!,
              handles: [{ id: 'out', type: 'source', position: 'right' }],
            },
            () => {
              ui.label('Source A').classes('text-sm font-medium');
              ui.badge('metrics', { variant: 'outline' });
            },
          );

          flow.node(
            {
              id: 'sourceB',
              position: GRAPH_POSITIONS.sourceB!,
              handles: [{ id: 'out', type: 'source', position: 'right' }],
            },
            () => {
              ui.label('Source B').classes('text-sm font-medium');
              ui.badge('events', { variant: 'outline' });
            },
          );

          flow.node(
            {
              id: 'merge',
              position: GRAPH_POSITIONS.merge!,
              handles: [
                { id: 'a', type: 'target', position: 'left' },
                { id: 'b', type: 'target', position: 'bottom' },
                { id: 'ok', type: 'source', position: 'right' },
                { id: 'err', type: 'source', position: 'top' },
              ],
            },
            () => {
              flowNodeText('Merge', 'Join A+B → ok | err');
              ui.button('Simulate ok', {
                size: 'sm',
                onClick: () => ui.notify('Merge path: ok', 'success'),
              });
            },
          );

          flow.node(
            {
              id: 'outOk',
              position: GRAPH_POSITIONS.outOk!,
              handles: [{ id: 'in', type: 'target', position: 'left' }],
            },
            () => {
              flowNodeText('OK sink', 'Happy path');
            },
          );

          flow.node(
            {
              id: 'outErr',
              position: GRAPH_POSITIONS.outErr!,
              handles: [{ id: 'in', type: 'target', position: 'left' }],
            },
            () => {
              flowNodeText('Error sink', 'Connect merge:err → here');
            },
          );
        },
      );

      ui.row(() => {
        ui.button('Add stage', {
          size: 'sm',
          onClick: () => {
            graph.stageCounter += 1;
            const n = graph.stageCounter;
            const id = `stage-${n}`;
            const title = `Stage ${n}`;
            graphFlow.addNode(
              {
                id,
                position: { x: 200 + n * 40, y: 320 },
                handles: [
                  { id: 'in', type: 'target', position: 'left' },
                  { id: 'out', type: 'source', position: 'right' },
                ],
              },
              () => {
                ui.label(title).classes('text-sm font-medium');
                ui.badge('dynamic', { variant: 'secondary' });
                ui.button('Remove', {
                  size: 'sm',
                  variant: 'ghost',
                  onClick: () => {
                    graphFlow.removeNode(id);
                    graph.dynamicCount = Math.max(0, graph.dynamicCount - 1);
                    shared.lastEvent = `[graph] removed ${id}`;
                  },
                });
              },
            );
            graph.dynamicCount += 1;
            shared.lastEvent = `[graph] added ${id}`;
          },
        });
        ui.button('Reset graph', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            for (const id of graphFlow.getNodeIds()) {
              if (!STATIC_GRAPH_IDS.has(id)) graphFlow.removeNode(id);
            }
            graphFlow.setEdges(cloneEdges(GRAPH_EDGES));
            restorePositions(graphFlow, GRAPH_POSITIONS);
            graph.stageCounter = 0;
            graph.dynamicCount = 0;
            shared.lastEvent = '[graph] reset';
          },
        });
        ui.auto(() => {
          ui.label(`Dynamic stages: ${graph.dynamicCount}`).classes(
            'text-sm text-muted-foreground self-center',
          );
        });
      }, { gap: 2 }).classes('items-center');

      ui.separator();

      exampleSection(
        '2. Group / subflow containers',
        'flow.group creates a dashed parent; child nodes set parentId (positions relative to the group). Drag stays inside the parent by default. Nested drill-in editing is deferred — this is visual grouping.',
      );

      const groupFlow = ui.flow(
        {
          edges: [
            {
              id: 'e-in-prep',
              source: 'ingest',
              target: 'prep',
              sourceHandle: 'out',
              targetHandle: 'in',
              type: 'smoothstep',
            },
            {
              id: 'e-prep-out',
              source: 'prep',
              target: 'publish',
              sourceHandle: 'out',
              targetHandle: 'in',
              type: 'smoothstep',
              variant: 'primary',
              label: 'ready',
            },
          ],
          fitView: true,
          showMiniMap: false,
          showControls: true,
          onConnect: (payload) => {
            shared.lastEvent = `[groups] connect ${payload.source} → ${payload.target}`;
          },
          onNodeMove: (payload) => {
            shared.lastEvent = `[groups] move ${payload.nodeId}`;
          },
          onNodesDelete: (ids) => {
            shared.lastEvent = `[groups] nodesDelete ${ids.join(',')}`;
          },
        },
        (flow) => {
          flow.group(
            {
              id: 'pipeline',
              position: { x: 40, y: 40 },
              width: 460,
              height: 240,
            },
            () => {
              flowNodeText('Ingest pipeline', 'Children use parentId');
            },
          );

          flow.node(
            {
              id: 'ingest',
              position: { x: 24, y: 56 },
              parentId: 'pipeline',
              handles: [
                { id: 'out', type: 'source', position: 'right' },
              ],
            },
            () => {
              ui.label('Ingest').classes('text-sm font-medium');
              ui.badge('group child', { variant: 'outline' });
            },
          );

          flow.node(
            {
              id: 'prep',
              position: { x: 220, y: 56 },
              parentId: 'pipeline',
              handles: [
                { id: 'in', type: 'target', position: 'left' },
                { id: 'out', type: 'source', position: 'right' },
              ],
            },
            () => {
              flowNodeText('Prep', 'Clean + validate');
            },
          );

          flow.node(
            {
              id: 'publish',
              position: { x: 560, y: 100 },
              handles: [{ id: 'in', type: 'target', position: 'left' }],
            },
            () => {
              flowNodeText('Publish', 'Outside the group');
            },
          );
        },
      );

      ui.row(() => {
        ui.button('Auto-layout groups', {
          variant: 'secondary',
          size: 'sm',
          onClick: () => {
            groupFlow.layout({ direction: 'LR', rankSep: 72, nodeSep: 40 });
            shared.lastEvent = '[groups] layout';
          },
        });
        ui.button('Reset groups', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            groupFlow.moveNode('pipeline', { x: 40, y: 40 });
            groupFlow.moveNode('ingest', { x: 24, y: 56 });
            groupFlow.moveNode('prep', { x: 220, y: 56 });
            groupFlow.moveNode('publish', { x: 560, y: 100 });
            shared.lastEvent = '[groups] reset';
          },
        });
      }, { gap: 2 }).classes('items-center');
    }, { gap: 6 });
  });
});
