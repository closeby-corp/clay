import { describe, expect, test } from 'bun:test';
import { ui } from './index';

describe('ui facade attachment', () => {
  test('flow is on the ui object (not only a named export)', () => {
    expect(typeof ui.flow).toBe('function');
    const el = ui.flow({ edges: [] }, (flow) => {
      flow.node({ id: 'a', position: { x: 0, y: 0 } }, () => {
        ui.label('A');
      });
    });
    expect(el.type).toBe('flow');
    expect(el.children[0]?.type).toBe('flowNode');
  });

  test('kanban / gantt remain attached', () => {
    expect(typeof ui.kanban).toBe('function');
    expect(typeof ui.gantt).toBe('function');
  });
});
