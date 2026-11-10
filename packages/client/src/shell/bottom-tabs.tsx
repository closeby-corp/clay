import { useEffect } from 'react';
import { EllipsisIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { go, resolveNavIcon, shouldHandleNavClick, type ShellNavItem } from './types';

const MAX_TABS = 4;
const isNavigable = (href: string) => !!href && !href.startsWith('#');
/** A tab is current when it or any nested child page is active. */
const isActiveTree = (item: ShellNavItem): boolean => !!item.active || !!item.items?.some(isActiveTree);

/** Top-level nav items shown as tabs: own href if navigable, group containers without one are skipped. */
export function bottomTabItems(nav: readonly ShellNavItem[]): ShellNavItem[] {
  return nav.filter((item) => isNavigable(item.href)).slice(0, MAX_TABS);
}

/** Fixed bottom tab bar for phones; "More" opens the sidebar sheet. */
export function BottomTabs({
  nav,
  hasOtherNav,
}: {
  nav: readonly ShellNavItem[];
  /** navSecondary / documents / user exist, so the sheet has more to show. */
  hasOtherNav: boolean;
}) {
  const { setOpenMobile } = useSidebar();
  const tabs = bottomTabItems(nav);
  const showMore = nav.length > tabs.length || hasOtherNav;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--clay-tabbar-h', 'calc(3.5rem + env(safe-area-inset-bottom))');
    return () => {
      root.style.removeProperty('--clay-tabbar-h');
    };
  }, []);

  const tabClass =
    'flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium outline-none transition-colors focus-visible:bg-accent';

  return (
    <nav
      data-clay-tabbar
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md backdrop-saturate-150"
    >
      {tabs.map((item) => {
        const Icon = resolveNavIcon(item.icon);
        const active = isActiveTree(item);
        return (
          <a
            key={item.href + item.label}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(tabClass, active ? 'text-primary' : 'text-muted-foreground')}
            onClick={(e) => {
              if (!shouldHandleNavClick(e)) return;
              e.preventDefault();
              go(item.href);
            }}
          >
            <Icon className="size-5 shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </a>
        );
      })}
      {showMore ? (
        <button
          type="button"
          className={cn(tabClass, 'text-muted-foreground')}
          onClick={() => setOpenMobile(true)}
        >
          <EllipsisIcon className="size-5 shrink-0" />
          <span>More</span>
        </button>
      ) : null}
    </nav>
  );
}
