import type { CSSProperties, ReactNode } from 'react';
import { ArrowUpCircleIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { NavDocuments } from './shell/nav-documents';
import { NavMain } from './shell/nav-main';
import { NavSecondary } from './shell/nav-secondary';
import { NavUser } from './shell/nav-user';
import { SiteHeader } from './shell/site-header';
import { go, type ShellNavItem, type ShellUser } from './shell/types';

export type { ShellNavItem, ShellUser };

export function BoundAppShell({
  title,
  headerTitle,
  collapsible = 'icon',
  variant = 'inset',
  user,
  nav,
  navSecondary = [],
  documents = [],
  className,
  style,
  children,
}: {
  title: string;
  headerTitle?: string;
  collapsible?: 'offcanvas' | 'icon' | 'none';
  variant?: 'sidebar' | 'inset' | 'floating';
  user?: ShellUser | null;
  nav: ShellNavItem[];
  navSecondary?: ShellNavItem[];
  documents?: ShellNavItem[];
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const active = nav.find((item) => item.active);
  const pageTitle = headerTitle || active?.label || title || 'BadUI';

  return (
    <SidebarProvider
      className={cn(className)}
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
          ...style,
        } as CSSProperties
      }
    >
      <Sidebar collapsible={collapsible} variant={variant}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    go('/');
                  }}
                >
                  <ArrowUpCircleIcon className="size-5" />
                  <span className="text-base font-semibold">{title || 'BadUI'}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={nav} />
          <NavDocuments items={documents} />
          <NavSecondary items={navSecondary} className="mt-auto" />
        </SidebarContent>
        {user ? (
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        ) : null}
      </Sidebar>
      <SidebarInset>
        <SiteHeader title={pageTitle} />
        <div className="@container/main flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Page inset remounts on navigate; sidebar chrome stays mounted (sticky app key). */}
            <div className="badui-animate-in px-4 lg:px-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
