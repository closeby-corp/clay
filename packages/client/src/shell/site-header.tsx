import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader({ title, hideTrigger = false }: { title: string; hideTrigger?: boolean }) {
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
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>
    </header>
  );
}
