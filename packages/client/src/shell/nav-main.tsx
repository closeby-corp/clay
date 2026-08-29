import { ChevronRightIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { go, resolveNavIcon, type ShellNavItem, type ShellPrimaryAction } from './types';

function NavLink({
  item,
  onNavigate,
  sub = false,
}: {
  item: ShellNavItem;
  onNavigate: (href: string) => void;
  sub?: boolean;
}) {
  const Icon = resolveNavIcon(item.icon);
  const content = (
    <>
      {!sub ? <Icon /> : null}
      <span>{item.label}</span>
    </>
  );

  if (sub) {
    return (
      <SidebarMenuSubButton asChild isActive={!!item.active}>
        <a
          href={item.href}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(item.href);
          }}
        >
          {content}
        </a>
      </SidebarMenuSubButton>
    );
  }

  return (
    <SidebarMenuButton asChild tooltip={item.label} isActive={!!item.active}>
      <a
        href={item.href}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(item.href);
        }}
      >
        {content}
      </a>
    </SidebarMenuButton>
  );
}

function NavMainItem({
  item,
  onNavigate,
}: {
  item: ShellNavItem;
  onNavigate: (href: string) => void;
}) {
  const subItems = item.items ?? [];
  if (subItems.length === 0) {
    return (
      <SidebarMenuItem>
        <NavLink item={item} onNavigate={onNavigate} />
      </SidebarMenuItem>
    );
  }

  const Icon = resolveNavIcon(item.icon);

  return (
    <SidebarMenuItem>
      <Collapsible defaultOpen={!!item.active} className="group/collapsible w-full">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.label} isActive={!!item.active}>
            <Icon />
            <span>{item.label}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems.map((sub) => (
              <SidebarMenuSubItem key={sub.href}>
                <NavLink item={sub} onNavigate={onNavigate} sub />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

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

  const onNavigate = (href: string) => {
    go(href);
    if (isMobile) setOpenMobile(false);
  };

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
                      onNavigate(primaryAction.href!);
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
          {items.map((item) => (
            <NavMainItem
              key={item.items?.length ? `${item.label}:${item.href}` : item.href}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
