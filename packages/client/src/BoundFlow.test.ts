import { describe, expect, test } from 'bun:test';
import { reconcileFlowEdges } from './BoundFlow';

describe('reconcileFlowEdges', () => {
  test('replaces optimistic id with server id for the same connection', () => {
    const prev = [
      {
        id: 'e-a-b-out-in-optimistic',
        source: 'a',
        target: 'b',
        sourceHandle: 'out',
        targetHandle: 'in',
        selected: true,
      },
    ];
    const server = [
      {
        id: 'e-a-b-out-in-server',
        source: 'a',
        target: 'b',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep' as const,
        label: 'go',
      },
    ];

    const next = reconcileFlowEdges(server, prev);
    expect(next).toHaveLength(1);
    expect(next[0]!.id).toBe('e-a-b-out-in-server');
    expect(next[0]!.selected).toBe(true);
    expect(next[0]!.type).toBe('smoothstep');
    expect(next[0]!.label).toBe('go');
  });

  test('keeps matching ids without remapping', () => {
    const edge = {
      id: 'e1',
      source: 'a',
      target: 'b',
      selected: true,
    };
    const next = reconcileFlowEdges([{ id: 'e1', source: 'a', target: 'b' }], [edge]);
    expect(next[0]!.id).toBe('e1');
    expect(next[0]!.selected).toBe(true);
  });
});
