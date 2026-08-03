import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  ChartArea,
  ClipboardList,
  Database,
  File,
  FormInput,
  Gauge,
  HelpCircle,
  Home,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Search,
  Settings,
  SlidersHorizontal,
  Table2,
  Upload,
} from 'lucide-react';

export type ShellNavItem = {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  active?: boolean;
};

export type ShellUser = {
  name: string;
  email: string;
  avatar?: string;
};

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  gauge: Gauge,
  'list-todo': ListTodo,
  'message-square': MessageSquare,
  upload: Upload,
  'layout-dashboard': LayoutDashboard,
  'table-2': Table2,
  'sliders-horizontal': SlidersHorizontal,
  'form-input': FormInput,
  'chart-area': ChartArea,
  boxes: Boxes,
  settings: Settings,
  'help-circle': HelpCircle,
  search: Search,
  database: Database,
  'clipboard-list': ClipboardList,
  file: File,
};

export function resolveNavIcon(icon?: string): LucideIcon {
  if (!icon) return Boxes;
  return iconMap[icon] ?? Boxes;
}

export function go(href: string) {
  if (!href || href === '#') return;
  if (href.startsWith('#')) return;
  if (href.startsWith('/')) {
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } else {
    window.location.href = href;
  }
}
