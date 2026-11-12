import { ui } from '@close-by/clay';
import type { FlowEdge, FlowElement, FlowPosition } from '@close-by/clay';

export function cloneEdges(edges: FlowEdge[]): FlowEdge[] {
  return edges.map((e) => ({ ...e }));
}

export function restorePositions(flow: FlowElement, positions: Record<string, FlowPosition>) {
  for (const [id, position] of Object.entries(positions)) {
    flow.moveNode(id, position);
  }
}

export function flowNodeText(title: string, description: string) {
  ui.label(title).classes('text-sm font-medium');
  ui.label(description).classes('text-xs text-muted-foreground');
}
