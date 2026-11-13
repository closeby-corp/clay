/// <reference types="vite/client" />
import { useEffect, useState, type CSSProperties } from 'react';
import { useTheme } from 'next-themes';
import { RadioGroup as Radio } from 'radix-ui';
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { currentPalette } from './themeBridge';
import type { ElementNode } from './protocol';
import paletteCss from './palettes.css?raw';
import baseCss from './index.css?raw';

// Read the source tokens so previews stay in sync with every built-in palette.
export function paletteColors(name: string, dark: boolean) {
  const selector = name === 'kiln' ? (dark ? '.dark' : ':root') : `:root${dark ? '.dark' : ''}[data-palette="${name}"]`;
  const css = name === 'kiln' ? baseCss : paletteCss;
  const block = css.slice(css.indexOf(`${selector} {`) + selector.length + 2).split('}')[0];
  return {
    background: block.match(/--primary:\s*([^;]+);/)?.[1],
    accent: block.match(/--chart-2:\s*([^;]+);/)?.[1],
  };
}

export function ThemePicker({ items, emit, className, style }: {
  items: ElementNode[];
  emit: (id: string, event: string, value: unknown) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const { theme = 'system', resolvedTheme } = useTheme();
  const [palette, setPalette] = useState(() => typeof document === 'undefined' ? 'kiln' : currentPalette());
  useEffect(() => {
    const observer = new MutationObserver(() => setPalette(currentPalette()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette'] });
    return () => observer.disconnect();
  }, []);
  const options = items.filter(item => item.type === 'dropdownitem');
  const select = (item: ElementNode) => emit(item.id, 'select', item.props.value);
  return <Popover>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Theme" className={className} style={style}><Palette aria-hidden /></Button></PopoverTrigger>
    <PopoverContent align="end" collisionPadding={12} className="w-72 max-w-[calc(100vw-1.5rem)] space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Appearance</p>
        <Radio.Root aria-label="Appearance" value={theme} onValueChange={value => select(options[['light', 'dark', 'system'].indexOf(value)])} className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {([Sun, Moon, Monitor] as const).map((Icon, index) => <Radio.Item key={index} value={['light', 'dark', 'system'][index]} className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs text-muted-foreground outline-none data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm focus-visible:ring-2 focus-visible:ring-ring">
            <Icon className="size-4" aria-hidden />{String(options[index]?.props.label)}
          </Radio.Item>)}
        </Radio.Root>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Palette</p>
        <Radio.Root aria-label="Palette" value={palette} onValueChange={value => select(options.find(item => item.props.label === value)!)} className="grid max-h-[min(60vh,calc(var(--radix-popover-content-available-height)-11rem))] grid-cols-4 gap-2 overflow-y-auto p-1">
          {options.slice(3).map(item => {
            const name = String(item.props.label);
            const colors = paletteColors(name, resolvedTheme === 'dark');
            return <Radio.Item key={item.id} value={name} className="flex min-w-0 flex-col items-center gap-1 rounded-md py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className={cn('relative flex size-9 items-center justify-center rounded-full border border-black/10', palette === name && 'ring-2 ring-ring ring-offset-2 ring-offset-popover')} style={{ background: colors.background }}>
                <span className="absolute -right-0.5 bottom-0 size-3 rounded-full border-2 border-popover" style={{ background: colors.accent }} />
                {palette === name ? <Check aria-hidden className="size-4 rounded-full bg-background text-foreground" /> : null}
              </span>
              <span className="max-w-full truncate text-xs">{name}</span>
            </Radio.Item>;
          })}
        </Radio.Root>
      </div>
    </PopoverContent>
  </Popover>;
}
