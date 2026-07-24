import type { CSSProperties, ReactNode } from 'react';
import {
  Boxes,
  FormInput,
  Gauge,
  Home,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  SlidersHorizontal,
  Table2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type AppNavItem = {
  label: string;
  href: string;
  description?: string;
  active?: boolean;
};

const navIcons: Record<string, LucideIcon> = {
  '/': Home,
  '/examples/counter': Gauge,
  '/examples/todo': ListTodo,
  '/examples/chat': MessageSquare,
  '/examples/upload': Upload,
  '/examples/dashboard': LayoutDashboard,
  '/examples/datatable': Table2,
  '/examples/slider-demo': SlidersHorizontal,
  '/examples/form-demo': FormInput,
  '/examples/kitchen-sink': Boxes,
};

function go(href: string) {
  if (href.startsWith('/')) {
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } else {
    window.location.href = href;
  }
}

function NavLink({ item }: { item: AppNavItem }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const Icon = navIcons[item.href] ?? Boxes;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={!!item.active}
        tooltip={item.label}
      >
        <a
          href={item.href}
          onClick={(e) => {
            e.preventDefault();
            go(item.href);
            if (isMobile) setOpenMobile(false);
          }}
        >
          <Icon />
          <span>{item.label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppBreadcrumb({ nav }: { nav: AppNavItem[] }) {
  const active = nav.find((item) => item.active);
  const isHome = !active || active.href === '/';

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {isHome ? (
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  go('/');
                }}
              >
                Examples
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{active.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function BoundAppShell({
  title,
  nav,
  className,
  style,
  children,
}: {
  title: string;
  nav: AppNavItem[];
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <SidebarProvider className={cn(className)} style={style}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="data-[slot=sidebar-menu-button]:!p-2"
              >
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    go('/');
                  }}
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Boxes className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{title || 'BadUI'}</span>
                    <span className="truncate text-xs text-muted-foreground">Demo</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Examples</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <AppBreadcrumb nav={nav} />
          </div>
        </header>
        <div className="flex flex-1 justify-center overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="badui-animate-in w-full max-w-5xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
