import { Element, withParent } from '@close-by/clay-core';
import { type IconSlotProps, withIconSlot } from './icon-text';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = {
  text?: string;
  /** Lucide kebab-case name (full set shipped in the client). */
  icon?: string;
  /** Where to place `icon` relative to the label. Default `'start'`. */
  iconPosition?: 'start' | 'end';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  onClick?: () => void | Promise<void>;
};

export function button(text?: string | (() => string), props: Omit<ButtonProps, 'text'> = {}): Element {
  if (typeof text === 'function') {
    return new Element('button', {
      text: '',
      icon: props.icon,
      iconPosition: props.iconPosition ?? 'start',
      variant: props.variant ?? 'default',
      size: props.size ?? 'default',
      disabled: props.disabled ?? false,
      className: props.className,
      onClick: props.onClick,
    }).bindText(text);
  }
  return new Element('button', {
    text: text ?? '',
    icon: props.icon,
    iconPosition: props.iconPosition ?? 'start',
    variant: props.variant ?? 'default',
    size: props.size ?? 'default',
    disabled: props.disabled ?? false,
    className: props.className,
    onClick: props.onClick,
  });
}

export type IconButtonProps = Omit<ButtonProps, 'text' | 'icon'> & {
  /** Lucide kebab-case name (required). */
  icon: string;
  /** Accessible / visible label. Omit for icon-only (`size` defaults to `'icon'`). */
  label?: string;
};

/** Toolbar-friendly button with a leading (or trailing) icon. Prefer `ui.iconButton`. */
export function iconButton(props: IconButtonProps): Element {
  const { icon, label, size, iconPosition, ...rest } = props;
  return button(label ?? '', {
    ...rest,
    icon,
    iconPosition: iconPosition ?? 'start',
    size: size ?? (label ? 'default' : 'icon'),
  });
}

export type LabelProps = IconSlotProps & {
  text?: string;
  className?: string;
};

export function label(text?: string | (() => string), props: Omit<LabelProps, 'text'> = {}): Element {
  if (typeof text === 'function') {
    return new Element(
      'label',
      withIconSlot(props, {
        text: '',
        className: props.className,
      }),
    ).bindText(text);
  }
  return new Element(
    'label',
    withIconSlot(props, {
      text: text ?? '',
      className: props.className,
    }),
  );
}

export type InputProps = {
  value?: string;
  placeholder?: string;
  type?: string;
  label?: string;
  /** Field-level validation message (empty/omitted = valid). */
  error?: string;
  disabled?: boolean;
  className?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
};

export function input(props: InputProps = {}): Element {
  return new Element('input', {
    value: props.value ?? '',
    placeholder: props.placeholder ?? '',
    type: props.type ?? 'text',
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onInput: props.onInput,
    onChange: props.onChange,
  });
}

export type CheckboxProps = {
  checked?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
};

export function checkbox(props: CheckboxProps = {}): Element {
  return new Element('checkbox', {
    value: props.checked ?? false,
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type SwitchProps = {
  checked?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
  onChange?: (checked: boolean) => void;
};

export function switchControl(props: SwitchProps = {}): Element {
  return new Element('switch', {
    value: props.checked ?? false,
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    size: props.size ?? 'default',
    className: props.className,
    onChange: props.onChange,
  });
}

export type SpinnerProps = {
  className?: string;
};

export function spinner(props: SpinnerProps = {}): Element {
  return new Element('spinner', {
    className: props.className,
  });
}

export type ProgressProps = {
  /** 0–100 */
  value?: number;
  className?: string;
};

export function progress(props: ProgressProps = {}): Element {
  return new Element('progress', {
    value: props.value ?? 0,
    className: props.className,
  });
}

export type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

export function separator(props: SeparatorProps = {}): Element {
  return new Element('separator', {
    orientation: props.orientation ?? 'horizontal',
    className: props.className,
  });
}

export type IconProps = {
  /**
   * Lucide kebab-case name (full library is bundled in the client).
   * Examples: `home`, `gauge`, `copy`, `refresh-cw`, `external-link`, `sparkles`.
   */
  name?: string;
  className?: string;
};

export function icon(name: string, props: Omit<IconProps, 'name'> = {}): Element {
  return new Element('icon', {
    name,
    className: props.className,
  });
}

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function select(props: SelectProps): Element {
  return new Element('select', {
    options: props.options,
    value: props.value ?? props.options[0]?.value ?? '',
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type RadioGroupOption = { value: string; label: string };

export type RadioGroupProps = {
  options: RadioGroupOption[];
  value?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onChange?: (value: string) => void;
};

export function radioGroup(props: RadioGroupProps): Element {
  return new Element('radiogroup', {
    options: props.options,
    value: props.value ?? props.options[0]?.value ?? '',
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    orientation: props.orientation ?? 'vertical',
    className: props.className,
    onChange: props.onChange,
  });
}

export type ComboboxOption = { value: string; label: string };

export type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function combobox(props: ComboboxProps): Element {
  return new Element('combobox', {
    options: props.options,
    value: props.value ?? props.options[0]?.value ?? '',
    label: props.label,
    placeholder: props.placeholder ?? 'Search…',
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type DateProps = {
  /** ISO date string (`YYYY-MM-DD`) or empty. */
  value?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function date(props: DateProps = {}): Element {
  return new Element('date', {
    value: props.value ?? '',
    label: props.label,
    placeholder: props.placeholder ?? 'Pick a date',
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export type TooltipProps = {
  text: string;
  side?: TooltipSide;
  className?: string;
};

export function tooltip(fn: () => void, props: TooltipProps): Element;
export function tooltip(props: TooltipProps, fn: () => void): Element;
export function tooltip(
  propsOrFn: TooltipProps | (() => void),
  fnOrProps: (() => void) | TooltipProps,
): Element {
  let props: TooltipProps;
  let fn: () => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = fnOrProps as TooltipProps;
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }

  const el = new Element('tooltip', {
    text: props.text,
    side: props.side ?? 'top',
    className: props.className,
  });
  withParent(el, fn);
  return el;
}

export type AvatarProps = {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

export function avatar(props: AvatarProps = {}): Element {
  return new Element('avatar', {
    src: props.src,
    alt: props.alt ?? '',
    fallback: props.fallback ?? '?',
    size: props.size ?? 'default',
    className: props.className,
  });
}

export type SkeletonProps = {
  className?: string;
};

export function skeleton(props: SkeletonProps = {}): Element {
  return new Element('skeleton', {
    className: props.className ?? 'h-4 w-full',
  });
}

export type SliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  label?: string;
  error?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (value: number) => void;
};

export function slider(props: SliderProps = {}): Element {
  return new Element('slider', {
    min: props.min ?? 0,
    max: props.max ?? 100,
    step: props.step ?? 1,
    value: props.value ?? 0,
    label: props.label,
    error: props.error,
    showValue: props.showValue ?? false,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}

export type TextAreaProps = {
  value?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
};

export function textArea(props: TextAreaProps = {}): Element {
  return new Element('textarea', {
    value: props.value ?? '',
    placeholder: props.placeholder ?? '',
    label: props.label,
    error: props.error,
    rows: props.rows ?? 3,
    disabled: props.disabled ?? false,
    className: props.className,
    onInput: props.onInput,
    onChange: props.onChange,
  });
}

export type LinkProps = IconSlotProps & {
  href: string;
  text?: string;
  /**
   * When true, open in a new tab (`target=_blank`, `noopener`) instead of SPA navigate.
   * Prefer for http(s) URLs; same as `ui.externalLink`.
   */
  external?: boolean;
  className?: string;
};

export function link(text: string, href: string, props: Omit<LinkProps, 'href' | 'text'> = {}): Element {
  return new Element(
    'link',
    withIconSlot(props, {
      text,
      href,
      external: props.external ?? false,
      className: props.className,
    }),
  );
}

/** Anchor that opens `url` in a new tab. Prefer over `runJavaScript('window.open…')`. */
export function externalLink(
  text: string,
  url: string,
  props: Omit<LinkProps, 'href' | 'text' | 'external'> = {},
): Element {
  return link(text, url, { ...props, external: true });
}

export type BadgeProps = IconSlotProps & {
  text?: string | (() => string);
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Dense ops chip (`text-[10px]` / `h-5`). */
  size?: 'default' | 'xs';
  /** Named palette color (`green`, `red`, `amber`, …) or any CSS color (`#22c55e`, `rgb(…)`). Overrides variant when set. */
  color?: string;
  className?: string;
};

function isBadgeProps(value: unknown): value is BadgeProps {
  return typeof value === 'object' && value !== null;
}

export function badge(
  textOrProps?: string | (() => string) | BadgeProps,
  props: Omit<BadgeProps, 'text'> = {},
): Element {
  if (isBadgeProps(textOrProps)) {
    const { text, ...rest } = textOrProps;
    if (typeof text === 'function') {
      return new Element(
        'badge',
        withIconSlot(rest, {
          text: '',
          variant: rest.variant ?? 'default',
          size: rest.size ?? 'default',
          color: rest.color,
          className: rest.className,
        }),
      ).bindText(text);
    }
    return new Element(
      'badge',
      withIconSlot(rest, {
        text: text ?? '',
        variant: rest.variant ?? 'default',
        size: rest.size ?? 'default',
        color: rest.color,
        className: rest.className,
      }),
    );
  }
  if (typeof textOrProps === 'function') {
    return new Element(
      'badge',
      withIconSlot(props, {
        text: '',
        variant: props.variant ?? 'default',
        size: props.size ?? 'default',
        color: props.color,
        className: props.className,
      }),
    ).bindText(textOrProps);
  }
  return new Element(
    'badge',
    withIconSlot(props, {
      text: textOrProps ?? '',
      variant: props.variant ?? 'default',
      size: props.size ?? 'default',
      color: props.color,
      className: props.className,
    }),
  );
}

export type AlertProps = IconSlotProps & {
  message?: string;
  variant?: 'default' | 'destructive';
  className?: string;
};

export function alert(message?: string, props: Omit<AlertProps, 'message'> = {}): Element {
  return new Element(
    'alert',
    withIconSlot(props, {
      text: message ?? '',
      variant: props.variant ?? 'default',
      className: props.className,
    }),
  );
}

export type StatItem = {
  title: string;
  value: string | number;
  /** Badge text, e.g. `+12.5%` or `-20%`. */
  trend?: string;
  /** Controls trend icon; inferred from `trend` sign when omitted. */
  trendDirection?: 'up' | 'down';
  /** Bold footer line, e.g. `Trending up this month`. */
  footer?: string;
  /** Muted second footer line. */
  description?: string;
  /** Optional inline sparkline under the headline value. */
  sparkline?: {
    data: Record<string, unknown>[];
    xKey: string;
    yKey: string;
    type?: 'area' | 'line';
    color?: string;
    height?: number;
  };
};

export function stat(items: StatItem[], props: { className?: string } = {}): Element {
  return new Element('stat', {
    items,
    className: props.className,
  });
}

export {
  dataTable,
  DataTableElement,
  ROW_ID_FIELD,
  CELLS_FIELD,
  DETAIL_FIELD,
  GROUP_KEY_FIELD,
  normalizeTableData,
  rowsToCsv,
  rowsToTsv,
  rowsToJson,
  type TableColumn,
  type TableColumnFilter,
  type TableColumnEditor,
  type TableColumnPin,
  type TableColumnAggregate,
  type DataTableFacetOption,
  type DataTableAction,
  type DataTableProps,
  type DataTableView,
  type DataTableGroup,
  type DataTablePrimaryAction,
  type DataTableDensity,
  type DataTableSort,
  type DataTableSortDir,
  type DataTableQuery,
  type ExportFormat,
  type ExportMode,
} from './data-table';

export {
  type CartesianChartProps,
  type ChartSeries,
  type ChartHeadline,
  type ChartPeriod,
  type ChartReferenceLine,
  type ChartReferenceArea,
} from './chart-shared';

export {
  areaChart,
  type AreaChartProps,
  type AreaChartSeries,
} from './area-chart';

export {
  barChart,
  type BarChartProps,
  type BarChartSeries,
} from './bar-chart';

export {
  lineChart,
  type LineChartProps,
  type LineChartSeries,
} from './line-chart';

export {
  pieChart,
  type PieChartProps,
  type PieChartSeries,
} from './pie-chart';

export {
  radarChart,
  type RadarChartProps,
  type RadarChartSeries,
} from './radar-chart';

export {
  radialChart,
  type RadialChartProps,
  type RadialChartSeries,
} from './radial-chart';

export {
  scatterChart,
  type ScatterChartProps,
  type ScatterChartSeries,
} from './scatter-chart';

export {
  composedChart,
  type ComposedChartProps,
  type ComposedChartSeries,
  type ComposedSeriesType,
} from './composed-chart';

export { sparkline, type SparklineProps } from './sparkline';

export { dialog, DialogElement, type DialogProps } from './dialog';

export {
  dialogStack,
  DialogStackElement,
  type DialogStackProps,
  type DialogStackStepOptions,
} from './dialog-stack';

export {
  alertDialog,
  AlertDialogElement,
  type AlertDialogProps,
} from './alert-dialog';

export {
  dropdownMenu,
  DropdownMenuElement,
  type DropdownMenuProps,
  type DropdownItemOptions,
  type DropdownMenuVariant,
} from './dropdown-menu';

export {
  contextMenu,
  ContextMenuElement,
  type ContextMenuProps,
  type ContextMenuItemOptions,
} from './context-menu';

export {
  hoverCard,
  popover,
  PopoverElement,
  type HoverCardProps,
  type HoverCardSide,
  type PopoverProps,
} from './hover-card';

export { inputOtp, type InputOtpProps } from './input-otp';

export {
  toggleGroup,
  ToggleGroupElement,
  type ToggleGroupProps,
  type ToggleGroupType,
  type ToggleGroupVariant,
  type ToggleGroupSize,
  type ToggleItemOptions,
} from './toggle-group';

export {
  menubar,
  MenubarElement,
  MenubarMenuElement,
  MenubarRadioGroupElement,
  type MenubarProps,
  type MenubarItemOptions,
  type MenubarCheckboxOptions,
  type MenubarRadioGroupOptions,
  type MenubarRadioItemOptions,
} from './menubar';

export {
  carousel,
  CarouselElement,
  type CarouselProps,
  type CarouselOrientation,
} from './carousel';

export {
  command,
  CommandElement,
  CommandGroupElement,
  type CommandProps,
  type CommandMode,
  type CommandItemOptions,
} from './command';

export {
  resizable,
  ResizableElement,
  type ResizableProps,
  type ResizableOrientation,
  type ResizablePanelProps,
  type ResizableHandleProps,
} from './resizable';

export { scrollArea, type ScrollAreaProps } from './scroll-area';

export { viewportEnter, type ViewportEnterProps } from './viewport-enter';

export { keybind, type KeybindProps } from './keybind';

export { kbd, type KbdProps } from './kbd';

export {
  breadcrumb,
  type BreadcrumbItem,
  type BreadcrumbProps,
} from './breadcrumb';

export {
  sheet,
  SheetElement,
  type SheetProps,
  type SheetSide,
} from './sheet';

export {
  drawer,
  DrawerElement,
  type DrawerProps,
  type DrawerDirection,
} from './drawer';

export {
  tabs,
  TabsElement,
  type TabsProps,
  type TabPanelOptions,
} from './tabs';

export {
  accordion,
  AccordionElement,
  type AccordionProps,
  type AccordionType,
  type AccordionItemOptions,
} from './accordion';

export {
  collapsible,
  CollapsibleElement,
  type CollapsibleProps,
} from './collapsible';

export {
  confirm,
  prompt,
  choose,
  type ConfirmOptions,
  type PromptOptions,
  type ChooseOptions,
  type ChooseOption,
} from './imperative';

type LayoutProps = {
  gap?: string | number;
  className?: string;
  centered?: boolean;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
};

function layout(
  type: string,
  propsOrFn: LayoutProps | (() => void),
  fnOrProps?: (() => void) | LayoutProps,
): Element {
  let props: LayoutProps = {};
  let fn: (() => void) | undefined;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as LayoutProps) ?? {};
  } else {
    props = propsOrFn ?? {};
    fn = fnOrProps as (() => void) | undefined;
  }

  const el = new Element(type, {
    gap: props.gap ?? 2,
    className: props.className,
    centered: props.centered,
    width: props.width,
  });

  if (fn) {
    // Element already attached to current parent; run children under this layout
    withParent(el, fn);
  }
  return el;
}

export function row(fn: () => void, props?: LayoutProps): Element;
export function row(props: LayoutProps, fn: () => void): Element;
export function row(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('row', propsOrFn, fnOrProps);
}

export function column(fn: () => void, props?: LayoutProps): Element;
export function column(props: LayoutProps, fn: () => void): Element;
export function column(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('column', propsOrFn, fnOrProps);
}

export function container(fn: () => void, props?: LayoutProps): Element;
export function container(props: LayoutProps, fn: () => void): Element;
export function container(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('container', propsOrFn, fnOrProps);
}

export function hero(fn: () => void, props?: LayoutProps): Element;
export function hero(props: LayoutProps, fn: () => void): Element;
export function hero(propsOrFn: LayoutProps | (() => void), fnOrProps?: (() => void) | LayoutProps): Element {
  return layout('hero', propsOrFn, fnOrProps);
}

export type CardProps = LayoutProps & { title?: string; description?: string };

export function card(fn: (card: Element) => void, props?: CardProps): Element;
export function card(props: CardProps, fn: (card: Element) => void): Element;
export function card(
  propsOrFn: CardProps | ((card: Element) => void),
  fnOrProps?: ((card: Element) => void) | CardProps,
): Element {
  let props: CardProps = {};
  let fn: (card: Element) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as CardProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (card: Element) => void;
  }

  const el = new Element('card', {
    title: props.title,
    description: props.description,
    gap: props.gap ?? 4,
    className: props.className,
  });
  withParent(el, () => fn(el));
  return el;
}

export { app, type AppNavItem, type AppPrimaryAction, type AppProps, type AppUser } from './app';

export {
  markdown,
  html,
  image,
  iframe,
  type MarkdownProps,
  type HtmlProps,
  type ImageProps,
  type IframeProps,
} from './content';

export {
  upload,
  type UploadProps,
  type UploadVariant,
  type UploadedFile,
  type UploadProgress,
} from './upload';

export { rating, type RatingProps } from './rating';
export { colorPicker, type ColorPickerProps } from './color-picker';
export { tags, type TagsProps, type TagsOption } from './tags';
export { codeBlock, type CodeBlockProps } from './code-block';
export { tree, type TreeProps, type TreeNode } from './tree';
export { editor, type EditorProps, type EditorFormat } from './editor';
export {
  kanban,
  KanbanElement,
  KANBAN_DETAIL_FIELD,
  absoluteInsertIndex,
  type KanbanProps,
  type KanbanColumn,
  type KanbanCard,
  type KanbanLane,
  type KanbanCardMovePayload,
} from './kanban';
export {
  relativeTime,
  type RelativeTimeProps,
  type RelativeTimeTimezone,
  type RelativeTimeDateStyle,
  type RelativeTimeTimeStyle,
} from './relative-time';
export { qrCode, type QrCodeProps, type QrCodeLevel } from './qr-code';
export { imageZoom, type ImageZoomProps } from './image-zoom';
export {
  list,
  ListElement,
  type ListProps,
  type ListGroup,
  type ListItem,
  type ListItemMovePayload,
} from './list';
export {
  imageCrop,
  type ImageCropProps,
  type ImageCropPayload,
} from './image-crop';
export {
  gantt,
  GanttElement,
  type GanttProps,
  type GanttRow,
  type GanttItem,
  type GanttMarker,
  type GanttDependency,
  type GanttRange,
  type GanttItemMovePayload,
} from './gantt';
export {
  flow,
  FlowElement,
  makeFlowEdgeId,
  computeFlowLayout,
  type FlowProps,
  type FlowNodeProps,
  type FlowNodeKind,
  type FlowEdge,
  type FlowEdgePathType,
  type FlowEdgeVariant,
  type FlowHandle,
  type FlowHandlePosition,
  type FlowPosition,
  type FlowConnectPayload,
  type FlowNodeMovePayload,
  type FlowSelectionPayload,
  type FlowLayoutOptions,
  type FlowLayoutNodeMeta,
  type FlowLayoutDirection,
} from './flow';

export {
  chart,
  table,
  TableBuilder,
  type CategoriesChartBuilder,
  type TimeSeriesChartBuilder,
  type PieRowsBuilder,
  type PieMetricsBuilder,
  type RadialRowsBuilder,
  type RadarBuilder,
  type ScatterBuilder,
  type ComposedBuilder,
  type SeriesInput,
  type ChartChromeOpts,
  type PieRowKeys,
  type RadialRowKeys,
  type StackedGaugeOpts,
  type AreaTerminalOpts,
  type BarTerminalOpts,
  type LineTerminalOpts,
  type ComposedTerminalOpts,
  type PageSizeOptions,
  type GroupByOptions,
} from './builders';

export {
  ai,
  AiChatElement,
  type AiLoaderProps,
  type AiLoaderVariant,
  type AiThinkingProps,
  type AiMessageProps,
  type AiChatProps,
  type AiPromptBarProps,
  type AiPromptBarVariant,
  type AiCodeBlockProps,
  type AiApprovalProps,
  type AiToolChipsProps,
  type AiTasksProps,
  type AiRecommendationProps,
  type AiContextProps,
  type AiDiffTableProps,
  type AiInsightsProps,
  type AiSelectionActionsProps,
  type AiFineTuneProps,
  type AiIdLabel,
  type AiThinkingKind,
  type AiThinkingStep,
  type AiMessageRole,
  type AiMessageSource,
  type AiMessageAction,
  type AiChatMessage,
  type AiChatTab,
  type AiTaskStatus,
  type AiTask,
  type AiToolChip,
  type AiApprovalOption,
  type AiRecommendationAlternative,
  type AiContextChunk,
  type AiDiffRow,
  type AiDiffColumn,
  type AiInsight,
  type AiSelectionAction,
  type AiFineTuneField,
} from './ai';

export {
  iconText,
  statusDot,
  type IconSlotProps,
  type IconTextProps,
  type StatusDotProps,
  type StatusDotColor,
} from './icon-text';

export {
  timeline,
  type TimelineProps,
  type TimelineItem,
  type TimelineItemStatus,
} from './timeline';

export {
  feedRow,
  feedList,
  type FeedRowProps,
  type FeedRowStatus,
  type FeedListProps,
} from './feed-row';

export {
  stepper,
  StepperElement,
  type StepperProps,
  type StepperStepOptions,
  type StepperStepStatus,
} from './stepper';

export {
  dateRange,
  type DateRangeProps,
  type DateRangePreset,
} from './date-range';

export {
  buttonGroup,
  type ButtonGroupProps,
  type ButtonGroupOrientation,
} from './button-group';

export { empty, type EmptyProps } from './empty-state';

export { pagination, type PaginationProps } from './pagination';

export {
  filterBar,
  filterChips,
  type FilterBarProps,
  type FilterChip,
} from './filter-bar';

export { numberField, type NumberFieldProps } from './number-field';

export {
  phoneInput,
  type PhoneInputProps,
  type PhoneCountry,
} from './phone-input';

export { field, type FieldProps, type FieldOrientation } from './field';

export {
  nativeSelect,
  type NativeSelectProps,
  type NativeSelectOption,
} from './native-select';

export {
  navigationMenu,
  NavigationMenuElement,
  NavigationMenuSubElement,
  type NavigationMenuProps,
  type NavigationMenuLinkItem,
} from './navigation-menu';

export { notice, type NoticeProps, type NoticeVariant } from './notice';

export {
  eventCalendar,
  type EventCalendarProps,
  type EventCalendarEvent,
} from './event-calendar';

export { inputGroup, type InputGroupProps } from './input-group';

export {
  toggleControl,
  type ToggleControlProps,
  type ToggleControlVariant,
  type ToggleControlSize,
} from './toggle-control';

export {
  descriptionList,
  type DescriptionListProps,
  type DescriptionListItem,
} from './description-list';

export {
  staticTable,
  type StaticTableProps,
  type StaticTableColumn,
} from './static-table';

export { aspectRatio, type AspectRatioProps } from './aspect-ratio';

export {
  itemList,
  type ItemListProps,
  type ItemListEntry,
} from './item-list';

export {
  checkboxGroup,
  type CheckboxGroupProps,
  type CheckboxGroupOption,
} from './checkbox-group';
