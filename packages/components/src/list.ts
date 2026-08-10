import { Element } from '@clay/core';

export type ListItem = {
  id: string;
  title: string;
  description?: string;
};

export type ListGroup = {
  id: string;
  title: string;
  items: ListItem[];
};

export type ListItemMovePayload = {
  itemId: string;
  fromGroupId: string;
  toGroupId: string;
  index: number;
};

export type ListProps = {
  groups?: ListGroup[];
  disabled?: boolean;
  className?: string;
  /**
   * Fired after the list applies the item move to its owned model.
   * Prefer side effects here; group/item order is already updated.
   */
  onItemMove?: (payload: ListItemMovePayload) => void | Promise<void>;
  onItemClick?: (itemId: string) => void | Promise<void>;
};

function cloneItem(item: ListItem): ListItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
  };
}

function cloneGroups(groups: ListGroup[]): ListGroup[] {
  return groups.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items.map(cloneItem),
  }));
}

/**
 * Dense vertical grouped list with cross-group drag. Owns groups + item order
 * (Kanban/DataTable-style); default `itemMove` settle handler updates that model
 * before user callbacks. Prefer mutating via element APIs instead of wrapping
 * the list in `ui.auto`.
 */
export class ListElement extends Element {
  constructor(props: ListProps = {}) {
    const { onItemMove, onItemClick, groups, disabled, className } = props;

    super('list', {
      groups: cloneGroups(groups ?? []),
      disabled: disabled ?? false,
      className,
    });

    // Always register settle events so the client emits them; update owned
    // model first, then chain user callbacks for side effects.
    this.on('itemMove', (value) => {
      const payload = value as ListItemMovePayload;
      if (!payload?.itemId || !payload.toGroupId) return;
      this.moveItem(payload);
    });
    if (onItemMove) {
      this.on('itemMove', (value) => onItemMove(value as ListItemMovePayload));
    }
    if (onItemClick) {
      this.on('itemClick', (value) => onItemClick(value as string));
    }
  }

  getGroups(): ListGroup[] {
    return cloneGroups((this.props.groups as ListGroup[] | undefined) ?? []);
  }

  setGroups(groups: ListGroup[]): this {
    this.update({ groups: cloneGroups(groups) });
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.update({ disabled });
    return this;
  }

  /** Move an item within/across groups and patch owned `groups`. */
  moveItem(payload: ListItemMovePayload): this {
    const { itemId, toGroupId, index } = payload;
    if (!itemId || !toGroupId) return this;

    const next = this.getGroups();
    let moved: ListItem | undefined;
    for (const g of next) {
      const idx = g.items.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        [moved] = g.items.splice(idx, 1);
        break;
      }
    }
    if (!moved) return this;

    const to = next.find((g) => g.id === toGroupId);
    if (!to) return this;

    const insertAt = Math.max(0, Math.min(Number(index) || 0, to.items.length));
    to.items.splice(insertAt, 0, moved);
    this.update({ groups: next });
    return this;
  }

  addItem(groupId: string, item: ListItem, index?: number): this {
    const next = this.getGroups();
    const group = next.find((g) => g.id === groupId);
    if (!group) return this;
    if (next.some((g) => g.items.some((x) => x.id === item.id))) return this;
    const insertAt =
      index === undefined
        ? group.items.length
        : Math.max(0, Math.min(index, group.items.length));
    group.items.splice(insertAt, 0, cloneItem(item));
    this.update({ groups: next });
    return this;
  }

  removeItem(itemId: string): this {
    const next = this.getGroups();
    let found = false;
    for (const g of next) {
      const idx = g.items.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        g.items.splice(idx, 1);
        found = true;
        break;
      }
    }
    if (!found) return this;
    this.update({ groups: next });
    return this;
  }

  addGroup(group: ListGroup, index?: number): this {
    const next = this.getGroups();
    if (next.some((g) => g.id === group.id)) return this;
    const insertAt =
      index === undefined
        ? next.length
        : Math.max(0, Math.min(index, next.length));
    next.splice(insertAt, 0, {
      id: group.id,
      title: group.title,
      items: group.items.map(cloneItem),
    });
    this.update({ groups: next });
    return this;
  }

  removeGroup(groupId: string): this {
    const groups = this.getGroups();
    const next = groups.filter((g) => g.id !== groupId);
    if (next.length === groups.length) return this;
    this.update({ groups: next });
    return this;
  }
}

export function list(props: ListProps = {}): ListElement {
  return new ListElement(props);
}
