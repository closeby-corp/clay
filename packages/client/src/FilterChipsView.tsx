import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FilterChipView = {
  id: string;
  label: string;
  value?: string;
};

export function FilterChipsView({
  chips,
  clearLabel = 'Clear all',
  className,
  renderChipText,
  onClear,
  onRemoveChip,
}: {
  chips: FilterChipView[];
  renderChipText?: (chip: FilterChipView) => ReactNode;
  clearLabel?: string;
  className?: string;
  onClear?: () => void;
  onRemoveChip?: (chipId: string) => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {chips.map((chip) => (
        <Badge key={chip.id} variant="secondary" className="gap-1 pr-1 font-normal">
          {renderChipText ? renderChipText(chip) : (
            <>
              <span className="text-muted-foreground">{chip.label}</span>
              {chip.value ? <span>{chip.value}</span> : null}
            </>
          )}
          {onRemoveChip ? (
            <button
              type="button"
              className="rounded-sm p-0.5 hover:bg-muted"
              aria-label={`Remove ${chip.label}`}
              onClick={() => onRemoveChip(chip.id)}
            >
              <X className="size-3" />
            </button>
          ) : null}
        </Badge>
      ))}
      {onClear ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onClear}>
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
