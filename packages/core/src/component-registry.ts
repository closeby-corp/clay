export interface PatchableComponent {
  id: string;
  render(): string;
}

const instances = new Map<string, PatchableComponent>();

export function registerComponentInstance(id: string, component: PatchableComponent): void {
  instances.set(id, component);
}

export function getComponentInstance(id: string): PatchableComponent | undefined {
  return instances.get(id);
}

export function isDataTableComponent(component: PatchableComponent | undefined): boolean {
  return !!component && component.constructor.name === 'DataTable';
}

export const DATA_TABLE_EVENT_TYPES = new Set([
  'sort',
  'page',
  'search',
  'select_row',
  'select_all',
  'toggle_column',
  'toggle_group',
  'reorder_columns',
  'move_column',
  'reorder_rows',
  'cell_edit',
  'paste',
  'begin_edit',
]);

export function isDataTableEvent(eventType: string, componentId: string): boolean {
  if (!DATA_TABLE_EVENT_TYPES.has(eventType)) return false;
  return isDataTableComponent(getComponentInstance(componentId));
}
