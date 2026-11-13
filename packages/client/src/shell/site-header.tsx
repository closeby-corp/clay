import { ShellStatus } from '../ShellStatus';
import { type ReactNode } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePhone } from '../hooks/use-phone';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader({ title, hideTrigger = false, actions = [] }: { title: string; hideTrigger?: boolean; actions?: ReactNode[] }) {
  const phone = usePhone();
  const inline = phone ? actions.slice(0, 2) : actions;
  const overflow = phone ? actions.slice(2) : [];
  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 rounded-t-[inherit] border-b bg-background/70 backdrop-blur-md backdrop-saturate-150 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {hideTrigger ? null : (
          <>
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
          </>
        )}
        <h1 className="min-w-0 truncate text-base font-semibold tracking-tight">{title}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-2" data-clay-header-actions>
          <ShellStatus />
          {inline}
          {overflow.length ? <Popover>
            <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="More header actions"><MoreHorizontalIcon /></Button></PopoverTrigger>
            <PopoverContent align="end" className="flex flex-col gap-2">{overflow}</PopoverContent>
          </Popover> : null}
        </div>
      </div>
    </header>
  );
}
