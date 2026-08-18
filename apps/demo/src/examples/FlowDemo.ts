import { ui } from '@close-by/clay';
import type { FlowEdge, FlowElement, FlowPosition } from '@close-by/clay';
import { exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Flow',
  icon: 'workflow',
  order: 92,
};

function cloneEdges(edges: FlowEdge[]): FlowEdge[] {
  return edges.map((e) => ({ ...e }));
}

function restorePositions(flow: FlowElement, positions: Record<string, FlowPosition>) {
  for (const [id, position] of Object.entries(positions)) {
    flow.moveNode(id, position);
  }
}

const PIPELINE_POSITIONS: Record<string, FlowPosition> = {
  fetch: { x: 0, y: 60 },
  transform: { x: 260, y: 60 },
  load: { x: 520, y: 60 },
  notify: { x: 780, y: 60 },
};

const PIPELINE_EDGES: FlowEdge[] = [
  {
    id: 'e-fetch-transform',
    source: 'fetch',
    target: 'transform',
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'smoothstep',
    label: 'raw',
    variant: 'primary',
  },
  {
    id: 'e-transform-load',
    source: 'transform',
    target: 'load',
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'smoothstep',
    label: 'rows',
    animated: true,
  },
];

const APPROVAL_POSITIONS: Record<string, FlowPosition> = {
  ticket: { x: 40, y: 120 },
  triage: { x: 320, y: 120 },
  approve: { x: 620, y: 20 },
  reject: { x: 620, y: 220 },
  done: { x: 900, y: 120 },
};

const APPROVAL_EDGES: FlowEdge[] = [
  {
    id: 'e-ticket-triage',
    source: 'ticket',
    target: 'triage',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    id: 'e-triage-approve',
    source: 'triage',
    target: 'approve',
    sourceHandle: 'yes',
    targetHandle: 'in',
  },
  {
    id: 'e-triage-reject',
    source: 'triage',
    target: 'reject',
    sourceHandle: 'no',
    targetHandle: 'in',
  },
];

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

ui.page('/examples/flow', () => {
  const shared = ui.state({ lastEvent: '' as string });

  const pipeline = ui.state({
    runs: 0,
    source: 'prod-api',
    dryRun: true,
  });

  const approval = ui.state({
    priority: 'normal',
    assignee: 'alice',
    severity: 3,
    escalate: false,
    decision: '' as string,
  });

  const graph = ui.state({
    stageCounter: 0,
    dynamicCount: 0,
  });

  ui.container({ centered: true, width: '2xl' }, () => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.flow — custom Clay trees inside React Flow nodes: forms, branching handles, fan-in/out, groups, and dynamic stages.',
        );

        ui.auto(() => {
          ui.label(shared.lastEvent ? `Last event: ${shared.lastEvent}` : 'Last event: —').classes(
            'text-sm text-muted-foreground',
          );
        });

        exampleSection(
          '1. Configurable ETL pipeline',
          'Controls live inside nodes (select + switch). Drag by the card chrome; Run uses nested onClick. Diagram state is owned by the flow element. Edges use smoothstep + labels; Auto-layout runs dagre (LR).',
        );

        const pipelineFlow = ui.flow(
          {
            edges: cloneEdges(PIPELINE_EDGES),
            fitView: true,
            showMiniMap: true,
            showControls: true,
            defaultEdgeType: 'smoothstep',
            onConnect: (payload) => {
              shared.lastEvent = `[pipeline] connect ${payload.source} → ${payload.target}`;
            },
            onNodeMove: (payload) => {
              shared.lastEvent = `[pipeline] move ${payload.nodeId} → (${Math.round(payload.position.x)}, ${Math.round(payload.position.y)})`;
            },
            onEdgesDelete: (ids) => {
              shared.lastEvent = `[pipeline] edgesDelete ${ids.join(',')}`;
            },
            onNodesDelete: (ids) => {
              shared.lastEvent = `[pipeline] nodesDelete ${ids.join(',')}`;
            },
          },
          (flow) => {
            flow.node(
              {
                id: 'fetch',
                position: PIPELINE_POSITIONS.fetch!,
                handles: [{ id: 'out', type: 'source', position: 'right' }],
              },
              () => {
                ui.label('Fetch').classes('text-sm font-medium');
                ui.auto(() => {
                  ui.badge(pipeline.dryRun ? 'dry-run' : 'live', {
                    variant: pipeline.dryRun ? 'secondary' : 'default',
                  });
                  ui.select({
                    options: [
                      { value: 'prod-api', label: 'Prod API' },
                      { value: 'staging', label: 'Staging' },
                      { value: 's3', label: 'S3 dump' },
                    ],
                    value: pipeline.source,
                    onChange: (v) => {
                      pipeline.source = String(v);
                    },
                  });
                  ui.switch({
                    checked: pipeline.dryRun,
                    label: 'Dry run',
                    onChange: (v) => {
                      pipeline.dryRun = !!v;
                    },
                  });
                });
                ui.button('Run', {
                  size: 'sm',
                  onClick: () => {
                    pipeline.runs += 1;
                    ui.notify(
                      `Fetch #${pipeline.runs} from ${pipeline.source}` +
                        (pipeline.dryRun ? ' (dry-run)' : ''),
                      'success',
                    );
                  },
                });
              },
            );

            flow.node(
              {
                id: 'transform',
                position: PIPELINE_POSITIONS.transform!,
                handles: [
                  { id: 'in', type: 'target', position: 'left' },
                  { id: 'out', type: 'source', position: 'right' },
                ],
              },
              () => {
                ui.label('Transform').classes('text-sm font-medium');
                ui.auto(() => {
                  ui.label(`Source: ${pipeline.source}`).classes('text-xs text-muted-foreground');
                  ui.progress({
                    value: pipeline.runs > 0 ? Math.min(100, pipeline.runs * 25) : 8,
                  });
                });
              },
            );

            flow.node(
              {
                id: 'load',
                position: PIPELINE_POSITIONS.load!,
                handles: [
                  { id: 'in', type: 'target', position: 'left' },
                  { id: 'out', type: 'source', position: 'right' },
                ],
              },
              () => {
                ui.label('Load').classes('text-sm font-medium');
                ui.label('Write destination').classes('text-xs text-muted-foreground');
                ui.button('Flush', {
                  size: 'sm',
                  variant: 'outline',
                  onClick: () => ui.notify('Load flushed', 'info'),
                });
              },
            );

            flow.node(
              {
                id: 'notify',
                position: PIPELINE_POSITIONS.notify!,
                handles: [{ id: 'in', type: 'target', position: 'left' }],
              },
              () => {
                ui.label('Notify').classes('text-sm font-medium');
                ui.label('Slack / email').classes('text-xs text-muted-foreground');
                ui.button('Ping', {
                  size: 'sm',
                  variant: 'secondary',
                  onClick: () => ui.notify('Team notified', 'success'),
                });
              },
            );
          },
        );

        ui.row(() => {
          ui.button('Reset pipeline', {
            variant: 'outline',
            size: 'sm',
            onClick: () => {
              pipelineFlow.setEdges(cloneEdges(PIPELINE_EDGES));
              restorePositions(pipelineFlow, PIPELINE_POSITIONS);
              pipeline.runs = 0;
              pipeline.source = 'prod-api';
              pipeline.dryRun = true;
              shared.lastEvent = '[pipeline] reset';
            },
          });
          ui.button('Auto-layout', {
            variant: 'secondary',
            size: 'sm',
            onClick: () => {
              pipelineFlow.layout({ direction: 'LR', rankSep: 80, nodeSep: 48 });
              shared.lastEvent = '[pipeline] layout';
            },
          });
          ui.auto(() => {
            ui.label(`Runs: ${pipeline.runs}`).classes('text-sm text-muted-foreground self-center');
          });
        }, { gap: 2 }).classes('items-center');

        ui.separator();

        exampleSection(
          '2. Branching approval (multi-handle)',
          'Triage exposes yes/no source handles. Nested selects, rating, and switch update server state; connect Approve → Done yourself.',
        );

        const approvalFlow = ui.flow(
          {
            edges: cloneEdges(APPROVAL_EDGES),
            fitView: true,
            showMiniMap: false,
            showControls: true,
            onConnect: (payload) => {
              shared.lastEvent = `[approval] connect ${payload.source} → ${payload.target}`;
            },
            onNodeMove: (payload) => {
              shared.lastEvent = `[approval] move ${payload.nodeId} → (${Math.round(payload.position.x)}, ${Math.round(payload.position.y)})`;
            },
            onEdgesDelete: (ids) => {
              shared.lastEvent = `[approval] edgesDelete ${ids.join(',')}`;
            },
            onNodesDelete: (ids) => {
              shared.lastEvent = `[approval] nodesDelete ${ids.join(',')}`;
            },
          },
          (flow) => {
            flow.node(
              {
                id: 'ticket',
                position: APPROVAL_POSITIONS.ticket!,
                handles: [{ id: 'out', type: 'source', position: 'right' }],
              },
              () => {
                ui.label('Ticket').classes('text-sm font-medium');
                ui.auto(() => {
                  ui.select({
                    options: [
                      { value: 'low', label: 'Low' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ],
                    value: approval.priority,
                    onChange: (v) => {
                      approval.priority = String(v);
                    },
                  });
                  ui.select({
                    options: [
                      { value: 'alice', label: 'Alice' },
                      { value: 'bob', label: 'Bob' },
                      { value: 'cara', label: 'Cara' },
                    ],
                    value: approval.assignee,
                    onChange: (v) => {
                      approval.assignee = String(v);
                    },
                  });
                  ui.rating({
                    value: approval.severity,
                    max: 5,
                    onChange: (v) => {
                      approval.severity = Number(v);
                    },
                  });
                });
              },
            );

            flow.node(
              {
                id: 'triage',
                position: APPROVAL_POSITIONS.triage!,
                handles: [
                  { id: 'in', type: 'target', position: 'left' },
                  { id: 'yes', type: 'source', position: 'top' },
                  { id: 'no', type: 'source', position: 'bottom' },
                ],
              },
              () => {
                ui.label('Triage').classes('text-sm font-medium');
                ui.auto(() => {
                  ui.label(
                    `${approval.priority} · ${approval.assignee} · ★${approval.severity}`,
                  ).classes('text-xs text-muted-foreground');
                  ui.switch({
                    checked: approval.escalate,
                    label: 'Escalate',
                    onChange: (v) => {
                      approval.escalate = !!v;
                    },
                  });
                  ui.badge(approval.escalate ? 'escalated' : 'standard', {
                    variant: approval.escalate ? 'destructive' : 'outline',
                  });
                });
              },
            );

            flow.node(
              {
                id: 'approve',
                position: APPROVAL_POSITIONS.approve!,
                handles: [
                  { id: 'in', type: 'target', position: 'left' },
                  { id: 'out', type: 'source', position: 'right' },
                ],
              },
              () => {
                ui.label('Approve').classes(
                  'text-sm font-medium text-green-700 dark:text-green-400',
                );
                ui.button('Sign off', {
                  size: 'sm',
                  onClick: () => {
                    approval.decision = 'approved';
                    ui.notify('Approved', 'success');
                  },
                });
              },
            );

            flow.node(
              {
                id: 'reject',
                position: APPROVAL_POSITIONS.reject!,
                handles: [
                  { id: 'in', type: 'target', position: 'left' },
                  { id: 'out', type: 'source', position: 'right' },
                ],
              },
              () => {
                ui.label('Reject').classes('text-sm font-medium text-red-700 dark:text-red-400');
                ui.button('Send back', {
                  size: 'sm',
                  variant: 'destructive',
                  onClick: () => {
                    approval.decision = 'rejected';
                    ui.notify('Rejected', 'error');
                  },
                });
              },
            );

            flow.node(
              {
                id: 'done',
                position: APPROVAL_POSITIONS.done!,
                handles: [{ id: 'in', type: 'target', position: 'left' }],
              },
              () => {
                ui.label('Done').classes('text-sm font-medium');
                ui.auto(() => {
                  ui.label(
                    approval.decision ? `Result: ${approval.decision}` : 'Awaiting path',
                  ).classes('text-xs text-muted-foreground');
                });
              },
            );
          },
        );

        ui.button('Reset approval', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            approvalFlow.setEdges(cloneEdges(APPROVAL_EDGES));
            restorePositions(approvalFlow, APPROVAL_POSITIONS);
            approval.priority = 'normal';
            approval.assignee = 'alice';
            approval.severity = 3;
            approval.escalate = false;
            approval.decision = '';
            shared.lastEvent = '[approval] reset';
          },
        });

        ui.separator();

        exampleSection(
          '3. Fan-in / fan-out + dynamic stages',
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
                ui.label('Merge').classes('text-sm font-medium');
                ui.label('Join A+B → ok | err').classes('text-xs text-muted-foreground');
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
                ui.label('OK sink').classes('text-sm font-medium');
                ui.label('Happy path').classes('text-xs text-muted-foreground');
              },
            );

            flow.node(
              {
                id: 'outErr',
                position: GRAPH_POSITIONS.outErr!,
                handles: [{ id: 'in', type: 'target', position: 'left' }],
              },
              () => {
                ui.label('Error sink').classes('text-sm font-medium');
                ui.label('Connect merge:err → here').classes('text-xs text-muted-foreground');
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
          '4. Group / subflow containers',
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
                ui.label('Ingest pipeline').classes('text-sm font-medium');
                ui.label('Children use parentId').classes('text-xs text-muted-foreground');
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
                ui.label('Prep').classes('text-sm font-medium');
                ui.label('Clean + validate').classes('text-xs text-muted-foreground');
              },
            );

            flow.node(
              {
                id: 'publish',
                position: { x: 560, y: 100 },
                handles: [{ id: 'in', type: 'target', position: 'left' }],
              },
              () => {
                ui.label('Publish').classes('text-sm font-medium');
                ui.label('Outside the group').classes('text-xs text-muted-foreground');
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
      },
      { gap: 6 },
    );
  });
});
