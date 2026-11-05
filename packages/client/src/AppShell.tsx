import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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
import { resolveAppShellTitle } from './shell/active-nav';
import {
  go,
  shouldHandleNavClick,
  type ShellNavItem,
  type ShellPrimaryAction,
  type ShellUser,
} from './shell/types';

export type { ShellNavItem, ShellPrimaryAction, ShellUser };

/** Page inset: fades in and lets cards cascade for ~850ms after each navigation. */
function PageEnter({ children }: { children: ReactNode }) {
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 850);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={cn('clay-animate-in flex flex-1 flex-col px-4 lg:px-6', entering && 'clay-entering')}>
      {children}
    </div>
  );
}

export function BoundAppShell({
  title,
  headerTitle,
  collapsible = 'icon',
  variant = 'inset',
  user,
  nav,
  navSecondary = [],
  documents = [],
  primaryAction,
  className,
  style,
  pageKey,
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
  primaryAction?: ShellPrimaryAction | null;
  className?: string;
  style?: CSSProperties;
  /** Changes on navigation (top-level page element ids) → replays the page entry. */
  pageKey?: string;
  children: ReactNode;
}) {
  const pageTitle = resolveAppShellTitle({
    title,
    headerTitle,
    nav,
    navSecondary,
    documents,
  });

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
                    if (!shouldHandleNavClick(e)) return;
                    e.preventDefault();
                    go('/');
                  }}
                >
                  <span className="clay-brand-gradient flex size-7 shrink-0 items-center justify-center rounded-lg shadow-primary">
                    <ArrowUpCircleIcon className="size-4" />
                  </span>
                  <span className="text-base font-bold tracking-tight">{title || 'Clay'}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={nav} primaryAction={primaryAction} />
          <NavDocuments items={documents} />
          <NavSecondary items={navSecondary} className="mt-auto" />
        </SidebarContent>
        {user ? (
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        ) : null}
      </Sidebar>
      <SidebarInset className="clay-ambient">
        <SiteHeader title={pageTitle} />
        <div className="@container/main flex flex-1 flex-col">
          {/* --clay-viewport-offset = header + vertical padding (+ inset margins on md+), for `fillViewport`. */}
          <div className="flex flex-1 flex-col gap-4 py-4 [--clay-viewport-offset:calc(var(--header-height)+2rem)] md:gap-6 md:py-6 md:[--clay-viewport-offset:calc(var(--header-height)+4rem)]">
            {/* Sidebar chrome stays mounted (sticky app key); the page inset remounts per page. */}
            <PageEnter key={pageKey}>{children}</PageEnter>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
