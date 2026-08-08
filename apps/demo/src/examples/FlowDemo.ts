import { ui } from '@badui/ui';
import type { FlowConnectPayload, FlowEdge, FlowNodeMovePayload, FlowPosition } from '@badui/ui';
import { exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Flow',
  icon: 'workflow',
  order: 92,
};

type Positions = Record<string, FlowPosition>;

function cloneEdges(edges: FlowEdge[]): FlowEdge[] {
  return edges.map((e) => ({ ...e }));
}

type DiagramSlice = {
  edges: FlowEdge[];
  positions: Positions;
};

function wireFlow(
  diagram: DiagramSlice,
  shared: { lastEvent: string },
  tag: string,
  extra?: Partial<{
    onNodesDelete: (ids: string[]) => void;
  }>,
) {
  return {
    onConnect: (payload: FlowConnectPayload) => {
      diagram.edges = [
        ...diagram.edges,
        {
          id: `e-${payload.source}-${payload.target}-${Date.now()}`,
          source: payload.source,
          target: payload.target,
          sourceHandle: payload.sourceHandle ?? undefined,
          targetHandle: payload.targetHandle ?? undefined,
        },
      ];
      shared.lastEvent = `[${tag}] connect ${payload.source} → ${payload.target}`;
    },
    onNodeMove: (payload: FlowNodeMovePayload) => {
      diagram.positions = {
        ...diagram.positions,
        [payload.nodeId]: payload.position,
      };
      shared.lastEvent = `[${tag}] move ${payload.nodeId} → (${Math.round(payload.position.x)}, ${Math.round(payload.position.y)})`;
    },
    onEdgesDelete: (ids: string[]) => {
      diagram.edges = diagram.edges.filter((e) => !ids.includes(e.id));
      shared.lastEvent = `[${tag}] edgesDelete ${ids.join(',')}`;
    },
    onNodesDelete: (ids: string[]) => {
      diagram.edges = diagram.edges.filter(
        (e) => !ids.includes(e.source) && !ids.includes(e.target),
      );
      for (const id of ids) delete diagram.positions[id];
      diagram.positions = { ...diagram.positions };
      extra?.onNodesDelete?.(ids);
      shared.lastEvent = `[${tag}] nodesDelete ${ids.join(',')}`;
    },
  };
}

const PIPELINE_POSITIONS: Positions = {
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
  },
  {
    id: 'e-transform-load',
    source: 'transform',
    target: 'load',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
];

const APPROVAL_POSITIONS: Positions = {
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

const GRAPH_POSITIONS: Positions = {
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

ui.page('/examples/flow', () => {
  const shared = ui.state({ lastEvent: '' as string });

  const pipeline = ui.state({
    edges: cloneEdges(PIPELINE_EDGES),
    positions: { ...PIPELINE_POSITIONS } as Positions,
    runs: 0,
    source: 'prod-api',
    dryRun: true,
  });

  const approval = ui.state({
    edges: cloneEdges(APPROVAL_EDGES),
    positions: { ...APPROVAL_POSITIONS } as Positions,
    priority: 'normal',
    assignee: 'alice',
    severity: 3,
    escalate: false,
    decision: '' as string,
  });

  const graph = ui.state({
    edges: cloneEdges(GRAPH_EDGES),
    positions: { ...GRAPH_POSITIONS } as Positions,
    extraStages: [] as { id: string; title: string }[],
    stageCounter: 0,
  });

  ui.container({ centered: true, width: '2xl' }, () => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.flow — custom BadUI trees inside React Flow nodes: forms, branching handles, fan-in/out, and dynamic stages.',
        );

        ui.auto(() => {
          ui.label(shared.lastEvent ? `Last event: ${shared.lastEvent}` : 'Last event: —').classes(
            'text-sm text-muted-foreground',
          );
        });

        exampleSection(
          '1. Configurable ETL pipeline',
          'Controls live inside nodes (select + switch). Drag by the card chrome; Run uses nested onClick.',
        );

        ui.auto(() => {
          ui.flow(
            {
              edges: pipeline.edges,
              fitView: true,
              showMiniMap: true,
              showControls: true,
              ...wireFlow(pipeline, shared, 'pipeline'),
            },
            (flow) => {
              flow.node(
                {
                  id: 'fetch',
                  position: pipeline.positions.fetch,
                  handles: [{ id: 'out', type: 'source', position: 'right' }],
                },
                () => {
                  ui.label('Fetch').classes('text-sm font-medium');
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
                  position: pipeline.positions.transform,
                  handles: [
                    { id: 'in', type: 'target', position: 'left' },
                    { id: 'out', type: 'source', position: 'right' },
                  ],
                },
                () => {
                  ui.label('Transform').classes('text-sm font-medium');
                  ui.label(`Source: ${pipeline.source}`).classes('text-xs text-muted-foreground');
                  ui.progress({
                    value: pipeline.runs > 0 ? Math.min(100, pipeline.runs * 25) : 8,
                  });
                },
              );

              flow.node(
                {
                  id: 'load',
                  position: pipeline.positions.load,
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
                  position: pipeline.positions.notify,
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
        });

        ui.row(() => {
          ui.button('Reset pipeline', {
            variant: 'outline',
            size: 'sm',
            onClick: () => {
              pipeline.edges = cloneEdges(PIPELINE_EDGES);
              pipeline.positions = { ...PIPELINE_POSITIONS };
              pipeline.runs = 0;
              pipeline.source = 'prod-api';
              pipeline.dryRun = true;
              shared.lastEvent = '[pipeline] reset';
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

        ui.auto(() => {
          ui.flow(
            {
              edges: approval.edges,
              fitView: true,
              showMiniMap: false,
              showControls: true,
              ...wireFlow(approval, shared, 'approval'),
            },
            (flow) => {
              flow.node(
                {
                  id: 'ticket',
                  position: approval.positions.ticket,
                  handles: [{ id: 'out', type: 'source', position: 'right' }],
                },
                () => {
                  ui.label('Ticket').classes('text-sm font-medium');
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
                },
              );

              flow.node(
                {
                  id: 'triage',
                  position: approval.positions.triage,
                  handles: [
                    { id: 'in', type: 'target', position: 'left' },
                    { id: 'yes', type: 'source', position: 'top' },
                    { id: 'no', type: 'source', position: 'bottom' },
                  ],
                },
                () => {
                  ui.label('Triage').classes('text-sm font-medium');
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
                },
              );

              flow.node(
                {
                  id: 'approve',
                  position: approval.positions.approve,
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
                  position: approval.positions.reject,
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
                  position: approval.positions.done,
                  handles: [{ id: 'in', type: 'target', position: 'left' }],
                },
                () => {
                  ui.label('Done').classes('text-sm font-medium');
                  ui.label(
                    approval.decision ? `Result: ${approval.decision}` : 'Awaiting path',
                  ).classes('text-xs text-muted-foreground');
                },
              );
            },
          );
        });

        ui.button('Reset approval', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            approval.edges = cloneEdges(APPROVAL_EDGES);
            approval.positions = { ...APPROVAL_POSITIONS };
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
          'Merge node has two target handles (a/b) and dual sources (ok/err). Add Stage appends a live flow.node at runtime.',
        );

        ui.auto(() => {
          ui.flow(
            {
              edges: graph.edges,
              fitView: true,
              showMiniMap: true,
              showControls: true,
              ...wireFlow(graph, shared, 'graph', {
                onNodesDelete: (ids) => {
                  graph.extraStages = graph.extraStages.filter((s) => !ids.includes(s.id));
                },
              }),
            },
            (flow) => {
              flow.node(
                {
                  id: 'sourceA',
                  position: graph.positions.sourceA,
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
                  position: graph.positions.sourceB,
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
                  position: graph.positions.merge,
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
                  position: graph.positions.outOk,
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
                  position: graph.positions.outErr,
                  handles: [{ id: 'in', type: 'target', position: 'left' }],
                },
                () => {
                  ui.label('Error sink').classes('text-sm font-medium');
                  ui.label('Connect merge:err → here').classes('text-xs text-muted-foreground');
                },
              );

              for (const stage of graph.extraStages) {
                const pos = graph.positions[stage.id] ?? { x: 280, y: 320 };
                flow.node(
                  {
                    id: stage.id,
                    position: pos,
                    handles: [
                      { id: 'in', type: 'target', position: 'left' },
                      { id: 'out', type: 'source', position: 'right' },
                    ],
                  },
                  () => {
                    ui.label(stage.title).classes('text-sm font-medium');
                    ui.badge('dynamic', { variant: 'secondary' });
                    ui.button('Remove', {
                      size: 'sm',
                      variant: 'ghost',
                      onClick: () => {
                        graph.extraStages = graph.extraStages.filter((s) => s.id !== stage.id);
                        graph.edges = graph.edges.filter(
                          (e) => e.source !== stage.id && e.target !== stage.id,
                        );
                        delete graph.positions[stage.id];
                        graph.positions = { ...graph.positions };
                        shared.lastEvent = `[graph] removed ${stage.id}`;
                      },
                    });
                  },
                );
              }
            },
          );
        });

        ui.row(() => {
          ui.button('Add stage', {
            size: 'sm',
            onClick: () => {
              graph.stageCounter += 1;
              const id = `stage-${graph.stageCounter}`;
              graph.extraStages = [...graph.extraStages, { id, title: `Stage ${graph.stageCounter}` }];
              graph.positions = {
                ...graph.positions,
                [id]: { x: 200 + graph.stageCounter * 40, y: 320 },
              };
              shared.lastEvent = `[graph] added ${id}`;
            },
          });
          ui.button('Reset graph', {
            variant: 'outline',
            size: 'sm',
            onClick: () => {
              graph.edges = cloneEdges(GRAPH_EDGES);
              graph.positions = { ...GRAPH_POSITIONS };
              graph.extraStages = [];
              graph.stageCounter = 0;
              shared.lastEvent = '[graph] reset';
            },
          });
          ui.auto(() => {
            ui.label(`Dynamic stages: ${graph.extraStages.length}`).classes(
              'text-sm text-muted-foreground self-center',
            );
          });
        }, { gap: 2 }).classes('items-center');
      },
      { gap: 6 },
    );
  });
});
