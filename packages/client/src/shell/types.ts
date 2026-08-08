import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartPie,
  CircleGauge,
  ClipboardList,
  Clock,
  ChartNoAxesGantt,
  Columns3,
  Database,
  File,
  FilePen,
  FormInput,
  Gauge,
  HelpCircle,
  Home,
  LayoutDashboard,
  Layers,
  ListTodo,
  MessageSquare,
  Radar,
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
  layers: Layers,
  'form-input': FormInput,
  'chart-area': ChartArea,
  'chart-bar': ChartBar,
  'chart-line': ChartLine,
  'chart-pie': ChartPie,
  'chart-radar': Radar,
  'chart-radial': CircleGauge,
  boxes: Boxes,
  clock: Clock,
  settings: Settings,
  'help-circle': HelpCircle,
  search: Search,
  database: Database,
  'clipboard-list': ClipboardList,
  'columns-3': Columns3,
  'chart-gantt': ChartNoAxesGantt,
  file: File,
  'file-pen': FilePen,
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
