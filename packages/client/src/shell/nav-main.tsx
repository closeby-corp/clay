import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { go, resolveNavIcon, type ShellNavItem, type ShellPrimaryAction } from './types';

export function NavMain({
  items,
  primaryAction,
}: {
  items: ShellNavItem[];
  primaryAction?: ShellPrimaryAction | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const PrimaryIcon = primaryAction
    ? resolveNavIcon(primaryAction.icon ?? 'plus-circle')
    : null;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {primaryAction && PrimaryIcon ? (
          <SidebarMenu>
            <SidebarMenuItem>
              {primaryAction.href ? (
                <SidebarMenuButton
                  asChild
                  tooltip={primaryAction.label}
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <a
                    href={primaryAction.href}
                    onClick={(e) => {
                      e.preventDefault();
                      go(primaryAction.href!);
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <PrimaryIcon />
                    <span>{primaryAction.label}</span>
                  </a>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip={primaryAction.label}
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <PrimaryIcon />
                  <span>{primaryAction.label}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        <SidebarMenu>
          {items.map((item) => {
            const Icon = resolveNavIcon(item.icon);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.label} isActive={!!item.active}>
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
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
