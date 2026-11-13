import type { ElementNode } from '../protocol';
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { go, resolveNavIcon } from './types';

export function MenuItems({ items, emit }: {
  items: ElementNode[];
  emit: (id: string, type: string, value?: unknown) => void;
}) {
  return items.map((item) => {
    if (item.type === 'dropdownseparator') return <DropdownMenuSeparator key={item.id} />;
    if (item.type === 'dropdownlabel') return <DropdownMenuLabel key={item.id}>{String(item.props.text ?? '')}</DropdownMenuLabel>;
    if (item.type !== 'dropdownitem') return null;
    const Icon = item.props.icon ? resolveNavIcon(String(item.props.icon)) : null;
    return <DropdownMenuItem key={item.id}
      variant={item.props.variant === 'destructive' ? 'destructive' : 'default'}
      disabled={!!item.props.disabled}
      onSelect={() => {
        if ((item.props.events as string[] | undefined)?.includes('select')) emit(item.id, 'select', item.props.value);
        if (item.props.href) go(String(item.props.href));
      }}>
      {Icon ? <Icon aria-hidden /> : null}
      {String(item.props.label ?? item.props.value ?? '')}
    </DropdownMenuItem>;
  });
}
