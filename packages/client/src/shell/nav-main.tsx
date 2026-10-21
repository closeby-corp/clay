import { useEffect, useReducer } from 'react';
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
import {
  go,
  resolveNavIcon,
  shouldHandleNavClick,
  type ShellNavItem,
  type ShellPrimaryAction,
} from './types';

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
      <Icon />
      <span>{item.label}</span>
    </>
  );

  if (sub) {
    return (
      <SidebarMenuSubButton asChild isActive={!!item.active}>
        <a
          href={item.href}
          onClick={(e) => {
            if (!shouldHandleNavClick(e)) return;
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
          if (!shouldHandleNavClick(e)) return;
          e.preventDefault();
          onNavigate(item.href);
        }}
      >
        {content}
      </a>
    </SidebarMenuButton>
  );
}

function activeDestination(item: ShellNavItem): string | undefined {
  const activeChildren = (item.items ?? []).filter((child) => child.active);
  if (activeChildren.length > 0) {
    const destinations = activeChildren
      .map(activeDestination)
      .filter((href): href is string => href !== undefined);
    if (destinations.length > 0) {
      return destinations.reduce((mostSpecific, href) =>
        href.length > mostSpecific.length ? href : mostSpecific,
      );
    }
  }
  return item.active ? item.href : undefined;
}

export type NavGroupState = {
  open: boolean;
  destination: string | undefined;
};

export type NavGroupAction =
  | { type: 'destinationChanged'; destination: string | undefined }
  | { type: 'openChanged'; open: boolean };

export function navGroupStateReducer(
  state: NavGroupState,
  action: NavGroupAction,
): NavGroupState {
  if (action.type === 'destinationChanged') {
    if (action.destination === state.destination) return state;
    return {
      destination: action.destination,
      open: action.destination === undefined ? state.open : true,
    };
  }
  if (action.open === state.open) return state;
  return { ...state, open: action.open };
}

function NavMainItem({
  item,
  onNavigate,
  sub = false,
}: {
  item: ShellNavItem;
  onNavigate: (href: string) => void;
  sub?: boolean;
}) {
  const subItems = item.items ?? [];
  const destination = activeDestination(item);
  const [groupState, dispatch] = useReducer(
    navGroupStateReducer,
    destination,
    (initialDestination): NavGroupState => ({
      open: initialDestination !== undefined,
      destination: initialDestination,
    }),
  );

  useEffect(() => {
    dispatch({ type: 'destinationChanged', destination });
  }, [destination]);

  if (subItems.length === 0) {
    return (
      sub ? (
        <SidebarMenuSubItem>
          <NavLink item={item} onNavigate={onNavigate} sub />
        </SidebarMenuSubItem>
      ) : (
        <SidebarMenuItem>
          <NavLink item={item} onNavigate={onNavigate} />
        </SidebarMenuItem>
      )
    );
  }

  const Icon = resolveNavIcon(item.icon);
  const chevronClassName = `ml-auto transition-transform duration-200 ${
    groupState.open ? 'rotate-90' : ''
  }`;
  const groupButton = sub ? (
    <CollapsibleTrigger asChild>
      <SidebarMenuSubButton asChild isActive={!!item.active}>
        <button type="button">
          <Icon />
          <span>{item.label}</span>
          <ChevronRightIcon className={chevronClassName} />
        </button>
      </SidebarMenuSubButton>
    </CollapsibleTrigger>
  ) : (
    <CollapsibleTrigger asChild>
      <SidebarMenuButton tooltip={item.label} isActive={!!item.active}>
        <Icon />
        <span>{item.label}</span>
        <ChevronRightIcon className={chevronClassName} />
      </SidebarMenuButton>
    </CollapsibleTrigger>
  );

  return (
    sub ? (
      <SidebarMenuSubItem>
        <Collapsible
          open={groupState.open}
          onOpenChange={(open) => dispatch({ type: 'openChanged', open })}
          className="group/collapsible w-full"
        >
          {groupButton}
          <CollapsibleContent>
            <SidebarMenuSub>
              {subItems.map((child) => (
                <NavMainItem
                  key={child.items?.length ? `${child.label}:${child.href}` : child.href}
                  item={child}
                  onNavigate={onNavigate}
                  sub
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    ) : (
      <SidebarMenuItem>
        <Collapsible
          open={groupState.open}
          onOpenChange={(open) => dispatch({ type: 'openChanged', open })}
          className="group/collapsible w-full"
        >
          {groupButton}
          <CollapsibleContent>
            <SidebarMenuSub>
              {subItems.map((child) => (
                <NavMainItem
                  key={child.items?.length ? `${child.label}:${child.href}` : child.href}
                  item={child}
                  onNavigate={onNavigate}
                  sub
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    )
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
                      if (!shouldHandleNavClick(e)) return;
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
