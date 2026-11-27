import { FolderIcon, MoreHorizontalIcon, ShareIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  go,
  resolveNavIcon,
  shouldHandleNavClick,
  type ShellNavItem,
} from './types';
import { useT } from '@/i18n';

export function NavDocuments({ items }: { items: ShellNavItem[] }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useT();

  if (items.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t('shell.documents')}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = resolveNavIcon(item.icon);
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (!shouldHandleNavClick(e)) return;
                    e.preventDefault();
                    go(item.href);
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <Icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover className="rounded-sm data-[state=open]:bg-accent">
                    <MoreHorizontalIcon />
                    <span className="sr-only">{t('common.more')}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                  align={isMobile ? 'end' : 'start'}
                >
                  <DropdownMenuItem>
                    <FolderIcon />
                    <span>{t('shell.open')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ShareIcon />
                    <span>{t('shell.share')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
