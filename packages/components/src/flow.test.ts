import { describe, expect, test } from 'bun:test';
import { ClientSession, runWithSession } from '@badui/core';
import { flow, FlowElement } from './flow';

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
});
