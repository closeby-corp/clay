import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type DataTableColumnEditor = 'text' | 'select' | 'number' | 'date' | 'boolean';
export type DataTableDensity = 'compact' | 'default' | 'comfortable';

export type EditableColumn = {
  header: string;
  align?: 'left' | 'right' | 'center';
  editor?: DataTableColumnEditor;
  editorOptions?: { value: string; label: string }[];
};

/**
 * Keep focus on a control after commit/cancel so keyboard users stay in the grid.
 * Uses rAF so Radix/select close + blur handlers settle first.
 */
function restoreFocus(el: HTMLElement | null | undefined) {
  if (!el) return;
  requestAnimationFrame(() => {
    if (typeof el.focus === 'function') el.focus({ preventScroll: true });
  });
}

export function EditableCell({
  column,
  value,
  onCommit,
  density,
}: {
  column: EditableColumn;
  value: unknown;
  onCommit: (next: unknown) => void;
  density: DataTableDensity;
}) {
  const inputHeight =
    density === 'compact' ? 'h-7' : density === 'comfortable' ? 'h-9' : 'h-8';
  const inputRef = useRef<HTMLInputElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const valueToLocal = (v: unknown) => {
    if (column.editor === 'date') return String(v ?? '').slice(0, 10);
    return v == null ? '' : String(v);
  };

  const [local, setLocal] = useState(() => valueToLocal(value));
  useEffect(() => {
    if (column.editor === 'date') {
      setLocal(String(value ?? '').slice(0, 10));
    } else if (column.editor !== 'boolean' && column.editor !== 'select') {
      setLocal(value == null ? '' : String(value));
    }
  }, [value, column.editor]);

  if (column.editor === 'boolean') {
    const checked = value === true || value === 'true' || value === 1 || value === '1';
    return (
      <div
        ref={cellRef}
        className={cn(
          'flex items-center',
          column.align === 'right' && 'justify-end',
          column.align === 'center' && 'justify-center',
        )}
        tabIndex={-1}
      >
        <Switch
          ref={switchRef}
          size="sm"
          checked={checked}
          onCheckedChange={(next) => {
            onCommit(next);
            restoreFocus(switchRef.current);
          }}
          aria-label={column.header}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              // Instant commit model — Esc keeps focus on the control (no cancel draft).
              e.preventDefault();
              restoreFocus(switchRef.current);
            }
          }}
        />
      </div>
    );
  }

  if (column.editor === 'select') {
    const options = column.editorOptions ?? [];
    const selectValue = String(value ?? '');
    return (
      <div ref={cellRef} className="min-w-0" tabIndex={-1}>
        <Select
          value={selectValue || undefined}
          onValueChange={(next) => {
            onCommit(next);
            restoreFocus(selectTriggerRef.current ?? cellRef.current);
          }}
          onOpenChange={(open) => {
            if (!open) {
              restoreFocus(selectTriggerRef.current ?? cellRef.current);
            }
          }}
        >
          <SelectTrigger
            ref={selectTriggerRef}
            size="sm"
            className="w-38"
            aria-label={column.header}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                // Let the select close when open; when closed, stay on the trigger.
                e.stopPropagation();
                restoreFocus(selectTriggerRef.current ?? cellRef.current);
              }
            }}
          >
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent align="end">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const inputType =
    column.editor === 'number' ? 'number' : column.editor === 'date' ? 'date' : 'text';

  const commit = () => {
    const prev =
      column.editor === 'date'
        ? String(value ?? '').slice(0, 10)
        : value == null
          ? ''
          : String(value);
    if (local === prev) return;
    if (column.editor === 'number') {
      if (local.trim() === '') {
        onCommit(null);
        return;
      }
      const n = Number(local);
      onCommit(Number.isFinite(n) ? n : local);
      return;
    }
    onCommit(local === '' ? null : local);
  };

  const cancel = () => {
    setLocal(valueToLocal(value));
    // Keep focus on the control (do not blur out of the grid).
    restoreFocus(inputRef.current ?? cellRef.current);
  };

  return (
    <div ref={cellRef} className="min-w-0" tabIndex={-1}>
      <Input
        ref={inputRef}
        type={inputType}
        className={cn(
          inputHeight,
          'w-full max-w-full min-w-0 border-transparent bg-transparent shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background',
          column.align === 'right' && 'text-right',
          column.align === 'center' && 'text-center',
        )}
        value={local}
        aria-label={column.header}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            // Stay in the cell after commit (don't blur out of the grid).
            restoreFocus(inputRef.current ?? cellRef.current);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
      />
    </div>
  );
}
