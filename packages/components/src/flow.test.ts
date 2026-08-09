import { describe, expect, test } from 'bun:test';
import { ClientSession, runWithSession } from '@badui/core';
import {
  computeFlowLayout,
  flow,
  FlowElement,
  makeFlowEdgeId,
} from './flow';

describe('FlowElement owned diagram state', () => {
  test('registers settle events even without user handlers', () => {
    const el = flow((f) => {
      f.node({ id: 'a', position: { x: 0, y: 0 } }, () => {});
    });
    expect(el.props.events).toEqual(
      expect.arrayContaining(['connect', 'nodeMove', 'nodesDelete', 'edgesDelete']),
    );
  });

  test('node seeds positions; moveNode patches flowNode position', () => {
    const el = flow((f) => {
      f.node({ id: 'a', position: { x: 10, y: 20 } }, () => {});
      f.node({ id: 'b', position: { x: 100, y: 0 } }, () => {});
    });
    expect(el.getPositions()).toEqual({
      a: { x: 10, y: 20 },
      b: { x: 100, y: 0 },
    });
    el.moveNode('a', { x: 40, y: 50 });
    expect(el.children[0]!.props.position).toEqual({ x: 40, y: 50 });
    expect(el.getPositions().a).toEqual({ x: 40, y: 50 });
  });

  test('setEdges / addEdge / removeEdges update owned edges', () => {
    const el = flow(
      {
        edges: [{ id: 'e1', source: 'a', target: 'b' }],
      },
      (f) => {
        f.node({ id: 'a', position: { x: 0, y: 0 } }, () => {});
        f.node({ id: 'b', position: { x: 100, y: 0 } }, () => {});
      },
    );
    expect(el.getEdges()).toEqual([{ id: 'e1', source: 'a', target: 'b' }]);

    el.addEdge({ id: 'e2', source: 'b', target: 'a', sourceHandle: 'out' });
    expect(el.getEdges().map((e) => e.id)).toEqual(['e1', 'e2']);

    el.addEdge({ id: 'e2', source: 'b', target: 'a' });
    expect(el.getEdges()).toHaveLength(2);

    el.removeEdges(['e1']);
    expect(el.getEdges().map((e) => e.id)).toEqual(['e2']);

    el.setEdges([{ id: 'e3', source: 'a', target: 'b' }]);
    expect(el.getEdges()).toEqual([{ id: 'e3', source: 'a', target: 'b' }]);
  });

  test('addNode / removeNode mutate children and incident edges', async () => {
    const messages: Array<{ op: string; patches?: Array<{ op: string }> }> = [];
    const session = new ClientSession('/flow-test', (m) =>
      messages.push(m as { op: string; patches?: Array<{ op: string }> }),
    );

    let el!: FlowElement;
    runWithSession(session, () => {
      el = flow(
        {
          edges: [
            { id: 'e1', source: 'a', target: 'b' },
            { id: 'e2', source: 'b', target: 'c' },
          ],
        },
        (f) => {
          f.node({ id: 'a', position: { x: 0, y: 0 } }, () => {});
          f.node({ id: 'b', position: { x: 100, y: 0 } }, () => {});
        },
      );
    });

    el.setSession(session);
    (session as { isMounted: boolean }).isMounted = true;

    el.addNode({ id: 'c', position: { x: 200, y: 0 } }, () => {});
    expect(el.getNodeIds()).toEqual(['a', 'b', 'c']);
    expect(el.getPositions().c).toEqual({ x: 200, y: 0 });
    await Promise.resolve();
    expect(
      messages.some(
        (m) => m.op === 'patch' && m.patches?.some((p) => p.op === 'setChildren'),
      ),
    ).toBe(true);

    el.removeNode('b');
    expect(el.getNodeIds()).toEqual(['a', 'c']);
    expect(el.getEdges()).toEqual([]);
    expect(el.getPositions().b).toBeUndefined();
  });

  test('default nodeMove / connect settle owned model then user handlers', async () => {
    const moves: string[] = [];
    const connects: string[] = [];
    const el = flow(
      {
        onNodeMove: (p) => {
          moves.push(p.nodeId);
        },
        onConnect: (p) => {
          connects.push(`${p.source}->${p.target}`);
        },
      },
      (f) => {
        f.node({ id: 'a', position: { x: 0, y: 0 } }, () => {});
        f.node({ id: 'b', position: { x: 100, y: 0 } }, () => {});
      },
    );

    await el.handleEvent('nodeMove', { nodeId: 'a', position: { x: 12, y: 34 } });
    expect(el.children[0]!.props.position).toEqual({ x: 12, y: 34 });
    expect(moves).toEqual(['a']);

    await el.handleEvent('connect', {
      source: 'a',
      target: 'b',
      sourceHandle: 'out',
      targetHandle: 'in',
    });
    expect(el.getEdges()).toHaveLength(1);
    expect(el.getEdges()[0]).toMatchObject({
      source: 'a',
      target: 'b',
      sourceHandle: 'out',
      targetHandle: 'in',
    });
    expect(connects).toEqual(['a->b']);
  });

  test('connect echoes client edge id and applies default edge style props', async () => {
    const seen: string[] = [];
    const el = flow(
      {
        defaultEdgeType: 'smoothstep',
        defaultEdgeAnimated: true,
        defaultEdgeVariant: 'primary',
        onConnect: (p) => {
          if (p.id) seen.push(p.id);
        },
      },
      (f) => {
        f.node({ id: 'a', position: { x: 0, y: 0 } }, () => {});
        f.node({ id: 'b', position: { x: 100, y: 0 } }, () => {});
      },
    );

    const clientId = makeFlowEdgeId('a', 'b', 'out', 'in', 'client-1');
    await el.handleEvent('connect', {
      id: clientId,
      source: 'a',
      target: 'b',
      sourceHandle: 'out',
      targetHandle: 'in',
    });

    expect(el.getEdges()).toEqual([
      {
        id: clientId,
        source: 'a',
        target: 'b',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        animated: true,
        variant: 'primary',
      },
    ]);
    expect(seen).toEqual([clientId]);
  });

  test('default edgesDelete / nodesDelete update owned model then user handlers', async () => {
    const deletedEdges: string[][] = [];
    const deletedNodes: string[][] = [];
    const el = flow(
      {
        edges: [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'b', target: 'c' },
        ],
        onEdgesDelete: (ids) => {
          deletedEdges.push(ids);
        },
        onNodesDelete: (ids) => {
          deletedNodes.push(ids);
        },
      },
      (f) => {
        f.node({ id: 'a', position: { x: 0, y: 0 } }, () => {});
        f.node({ id: 'b', position: { x: 100, y: 0 } }, () => {});
        f.node({ id: 'c', position: { x: 200, y: 0 } }, () => {});
      },
    );

    await el.handleEvent('edgesDelete', ['e1']);
    expect(el.getEdges().map((e) => e.id)).toEqual(['e2']);
    expect(deletedEdges).toEqual([['e1']]);

    await el.handleEvent('nodesDelete', ['b']);
    expect(el.getNodeIds()).toEqual(['a', 'c']);
    expect(el.getEdges()).toEqual([]);
    expect(deletedNodes).toEqual([['b']]);
  });

  test('layout() places nodes in LR layers from edge topology', () => {
    const el = flow(
      {
        edges: [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'b', target: 'c' },
          { id: 'e3', source: 'b', target: 'd' },
        ],
      },
      (f) => {
        f.node({ id: 'a', position: { x: 9, y: 9 } }, () => {});
        f.node({ id: 'b', position: { x: 9, y: 9 } }, () => {});
        f.node({ id: 'c', position: { x: 9, y: 9 } }, () => {});
        f.node({ id: 'd', position: { x: 9, y: 9 } }, () => {});
      },
    );

    el.layout({
      direction: 'LR',
      nodeWidth: 100,
      nodeHeight: 40,
      rankSep: 50,
      nodeSep: 20,
      origin: { x: 0, y: 0 },
    });

    const pos = el.getPositions();
    expect(pos.a!.x).toBeLessThan(pos.b!.x);
    expect(pos.b!.x).toBeLessThan(pos.c!.x);
    expect(pos.c!.x).toBe(pos.d!.x);
    expect(pos.c!.y).not.toBe(pos.d!.y);
  });

  test('group() + parentId; removeNode clears children', () => {
    const el = flow((f) => {
      f.group(
        {
          id: 'g1',
          position: { x: 0, y: 0 },
          width: 420,
          height: 260,
        },
        () => {},
      );
      f.node(
        {
          id: 'a',
          position: { x: 20, y: 40 },
          parentId: 'g1',
        },
        () => {},
      );
      f.node(
        {
          id: 'b',
          position: { x: 180, y: 40 },
          parentId: 'g1',
        },
        () => {},
      );
      f.node({ id: 'c', position: { x: 500, y: 0 } }, () => {});
    });

    expect(el.getNodeIds()).toEqual(['g1', 'a', 'b', 'c']);
    expect(el.children[0]!.props).toMatchObject({
      id: 'g1',
      kind: 'group',
      nodeType: 'baduiGroup',
      width: 420,
      height: 260,
    });
    expect(el.children[1]!.props.parentId).toBe('g1');

    el.removeNode('g1');
    expect(el.getNodeIds()).toEqual(['c']);
    expect(el.getPositions().a).toBeUndefined();
    expect(el.getPositions().g1).toBeUndefined();
  });

  test('layout() packs group children relatively', () => {
    const el = flow(
      {
        edges: [{ id: 'e1', source: 'a', target: 'b' }],
      },
      (f) => {
        f.group({ id: 'g1', position: { x: 0, y: 0 } }, () => {});
        f.node({ id: 'a', position: { x: 0, y: 0 }, parentId: 'g1' }, () => {});
        f.node({ id: 'b', position: { x: 0, y: 0 }, parentId: 'g1' }, () => {});
      },
    );

    el.layout({
      direction: 'LR',
      nodeWidth: 80,
      nodeHeight: 40,
      rankSep: 40,
      nodeSep: 16,
    });

    const pos = el.getPositions();
    expect(pos.a!.x).toBeLessThan(pos.b!.x);
    // Relative to group (origin padding inside group).
    expect(pos.a!.x).toBeGreaterThanOrEqual(0);
    expect(pos.a!.y).toBeGreaterThanOrEqual(0);
  });
});

describe('computeFlowLayout / makeFlowEdgeId', () => {
  test('makeFlowEdgeId is deterministic for the same inputs', () => {
    expect(makeFlowEdgeId('a', 'b', 'out', 'in')).toBe('e-a-b-out-in');
    expect(makeFlowEdgeId('a', 'b', 'out', 'in', 7)).toBe('e-a-b-out-in-7');
  });

  test('computeFlowLayout packs TB layers with dagre', () => {
    const positions = computeFlowLayout(
      ['root', 'left', 'right'],
      [
        { source: 'root', target: 'left' },
        { source: 'root', target: 'right' },
      ],
      {
        direction: 'TB',
        nodeWidth: 10,
        nodeHeight: 10,
        rankSep: 30,
        nodeSep: 10,
        origin: { x: 0, y: 0 },
      },
    );
    expect(positions.root!.y).toBeLessThan(positions.left!.y);
    expect(positions.left!.y).toBe(positions.right!.y);
    expect(positions.left!.x).not.toBe(positions.right!.x);
  });

  test('computeFlowLayout nests children under parentId', () => {
    const positions = computeFlowLayout(
      ['g', 'a', 'b', 'out'],
      [
        { source: 'a', target: 'b' },
        { source: 'g', target: 'out' },
      ],
      {
        direction: 'LR',
        nodeWidth: 100,
        nodeHeight: 40,
        nodes: {
          g: { kind: 'group', width: 300, height: 200 },
          a: { parentId: 'g' },
          b: { parentId: 'g' },
        },
      },
    );
    expect(positions.g!.x).toBeLessThan(positions.out!.x);
    expect(positions.a!.x).toBeLessThan(positions.b!.x);
  });
});
