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
  SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { NavDocuments } from './shell/nav-documents';
import { NavMain } from './shell/nav-main';
import { NavSecondary } from './shell/nav-secondary';
import { NavUser } from './shell/nav-user';
import { BottomTabs } from './shell/bottom-tabs';
import { usePhone } from './hooks/use-phone';
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
  headerActions = [],
  sidebarFooter,
  sidebarFooterCollapsed = 'hide',
  sidebarResizable = true,
  sidebarWidth,
  accountMenu,
  nav,
  navSecondary = [],
  documents = [],
  primaryAction,
  mobileNav = 'tabs',
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
  headerActions?: ReactNode[];
  sidebarFooter?: ReactNode;
  sidebarFooterCollapsed?: 'hide' | 'icons';
  sidebarResizable?: boolean;
  sidebarWidth?: { default?: string; min?: string; max?: string };
  accountMenu?: ReactNode;
  nav: ShellNavItem[];
  navSecondary?: ShellNavItem[];
  documents?: ShellNavItem[];
  primaryAction?: ShellPrimaryAction | null;
  /** Phones: `'tabs'` (default) shows a bottom tab bar, `'menu'` only the hamburger sheet. */
  mobileNav?: 'tabs' | 'menu';
  className?: string;
  style?: CSSProperties;
  /** Changes on navigation (top-level page element ids) → replays the page entry. */
  pageKey?: string;
  children: ReactNode;
}) {
  const phone = usePhone();
  const tabs = phone && mobileNav !== 'menu' && nav.length > 0;
  const pageTitle = resolveAppShellTitle({
    title,
    headerTitle,
    nav,
    navSecondary,
    documents,
  });

  return (
    <SidebarProvider
      resizable={sidebarResizable && !phone}
      sidebarWidth={sidebarWidth}
      className={cn(className)}
      style={
        {
          '--sidebar-width': sidebarWidth?.default ?? 'calc(var(--spacing) * 72)',
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
        {user || sidebarFooter ? (
          <SidebarFooter>
            {sidebarFooter ? <div className={cn(
              'px-2 py-1',
              !phone && sidebarFooterCollapsed === 'hide' && 'group-data-[collapsible=icon]:hidden',
              !phone && sidebarFooterCollapsed === 'icons' && 'group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:px-0 [&_span:not(:has(svg))]:group-data-[collapsible=icon]:sr-only [&_button]:group-data-[collapsible=icon]:size-8 [&_button]:group-data-[collapsible=icon]:p-0',
            )}>{sidebarFooter}</div> : null}
            {user ? <NavUser user={user} menu={accountMenu} /> : null}
          </SidebarFooter>
        ) : null}
        {!phone && sidebarResizable ? <SidebarRail collapsible={collapsible !== 'none'} /> : null}
      </Sidebar>
      <SidebarInset className="clay-ambient">
        <SiteHeader title={pageTitle} hideTrigger={tabs} actions={headerActions} />
        <div className="@container/main flex flex-1 flex-col">
          {/* --clay-viewport-offset = header + vertical padding (+ inset margins on md+), for `fillViewport`. */}
          <div className={cn("flex flex-1 flex-col gap-4 py-4 [--clay-viewport-offset:calc(var(--header-height)+2rem)] md:gap-6 md:py-6 md:[--clay-viewport-offset:calc(var(--header-height)+4rem)]", tabs ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))]" : "pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]")}>
            {/* Sidebar chrome stays mounted (sticky app key); the page inset remounts per page. */}
            <PageEnter key={pageKey}>{children}</PageEnter>
          </div>
        </div>
      </SidebarInset>
      {tabs ? (
        <BottomTabs nav={nav} hasOtherNav={navSecondary.length > 0 || documents.length > 0 || !!user || !!sidebarFooter} />
      ) : null}
    </SidebarProvider>
  );
}
