import { useOptimisticValue } from './useOptimisticValue';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CSSProperties } from 'react';

type Emit = (id: string, type: string, value?: unknown) => void;

type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

function asStyle(style: unknown): CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === 'string') {
    const out: Record<string, string> = {};
    for (const part of style.split(';')) {
      const [key, ...rest] = part.split(':');
      if (!key || rest.length === 0) continue;
      out[key.trim()] = rest.join(':').trim();
    }
    return out as CSSProperties;
  }
  return style as CSSProperties;
}

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

function TreeRows({
  nodes,
  depth,
  selected,
  expanded,
  disabled,
  onSelect,
  onToggle,
}: {
  nodes: TreeNode[];
  depth: number;
  selected: string;
  expanded: Set<string>;
  disabled: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const kids = node.children ?? [];
        const hasKids = kids.length > 0;
        const isOpen = expanded.has(node.id);
        const isSelected = selected === node.id;
        return (
          <div key={node.id}>
            <div
              className={cn(
                'flex items-center gap-0.5 rounded-md py-1 pr-2 text-sm',
                isSelected && 'bg-accent text-accent-foreground',
                !disabled && 'hover:bg-accent/60',
              )}
              style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
              {hasKids ? (
                <button
                  type="button"
                  disabled={disabled}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(node.id);
                  }}
                >
                  <ChevronRight
                    className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')}
                  />
                </button>
              ) : (
                <span className="inline-block size-5 shrink-0" />
              )}
              <button
                type="button"
                disabled={disabled}
                className="min-w-0 flex-1 truncate text-left disabled:opacity-50"
                onClick={() => onSelect(node.id)}
              >
                {node.label}
              </button>
            </div>
            {hasKids && isOpen ? (
              <TreeRows
                nodes={kids}
                depth={depth + 1}
                selected={selected}
                expanded={expanded}
                disabled={disabled}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function BoundTree({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const serverSelected = String(props.selected ?? '');
  const serverExpanded = (
    Array.isArray(props.expanded) ? props.expanded : []
  ) as string[];
  const [selected, setSelected] = useOptimisticValue(serverSelected);
  const [expandedList, setExpandedList] = useOptimisticValue(serverExpanded);
  const expanded = new Set(expandedList);
  const nodes = (Array.isArray(props.nodes) ? props.nodes : []) as TreeNode[];
  const disabled = !!props.disabled;

  return (
    <div
      className={cn('w-full rounded-md border p-1', className)}
      style={asStyle(style)}
      role="tree"
    >
      <TreeRows
        nodes={nodes}
        depth={0}
        selected={selected}
        expanded={expanded}
        disabled={disabled}
        onSelect={(nodeId) => {
          setSelected(nodeId);
          if (hasEvent(props, 'select')) emit(id, 'select', nodeId);
        }}
        onToggle={(nodeId) => {
          const next = expanded.has(nodeId)
            ? expandedList.filter((x) => x !== nodeId)
            : [...expandedList, nodeId];
          setExpandedList(next);
          if (hasEvent(props, 'expand')) emit(id, 'expand', next);
        }}
      />
    </div>
  );
}
