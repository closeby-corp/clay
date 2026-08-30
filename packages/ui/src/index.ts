import {
  button as buttonFactory,
  iconButton as iconButtonFactory,
  label as labelFactory,
  input as inputFactory,
  checkbox as checkboxFactory,
  switchControl as switchFactory,
  select as selectFactory,
  radioGroup as radioGroupFactory,
  combobox as comboboxFactory,
  date as dateFactory,
  dateRange as dateRangeFactory,
  timeline as timelineFactory,
  stepper as stepperFactory,
  tooltip as tooltipFactory,
  avatar as avatarFactory,
  skeleton as skeletonFactory,
  slider as sliderFactory,
  textArea as textAreaFactory,
  link as linkFactory,
  externalLink as externalLinkFactory,
  badge as badgeFactory,
  alert as alertFactory,
  spinner as spinnerFactory,
  progress as progressFactory,
  separator as separatorFactory,
  icon as iconFactory,
  iconText as iconTextFactory,
  statusDot as statusDotFactory,
  feedRow as feedRowFactory,
  feedList as feedListFactory,
  buttonGroup as buttonGroupFactory,
  empty as emptyFactory,
  pagination as paginationFactory,
  filterBar as filterBarFactory,
  filterChips as filterChipsFactory,
  numberField as numberFieldFactory,
  phoneInput as phoneInputFactory,
  field as fieldFactory,
  nativeSelect as nativeSelectFactory,
  navigationMenu as navigationMenuFactory,
  NavigationMenuElement,
  notice as noticeFactory,
  eventCalendar as eventCalendarFactory,
  stat as statFactory,
  inputGroup as inputGroupFactory,
  toggleControl as toggleControlFactory,
  descriptionList as descriptionListFactory,
  staticTable as staticTableFactory,
  aspectRatio as aspectRatioFactory,
  itemList as itemListFactory,
  checkboxGroup as checkboxGroupFactory,
  dataTable as dataTableFactory,
  areaChart as areaChartFactory,
  barChart as barChartFactory,
  lineChart as lineChartFactory,
  pieChart as pieChartFactory,
  radarChart as radarChartFactory,
  radialChart as radialChartFactory,
  scatterChart as scatterChartFactory,
  composedChart as composedChartFactory,
  sparkline as sparklineFactory,
  row as rowFactory,
  column as columnFactory,
  container as containerFactory,
  hero as heroFactory,
  card as cardFactory,
  dialog as dialogFactory,
  dialogStack as dialogStackFactory,
  alertDialog as alertDialogFactory,
  dropdownMenu as dropdownMenuFactory,
  breadcrumb as breadcrumbFactory,
  contextMenu as contextMenuFactory,
  hoverCard as hoverCardFactory,
  popover as popoverFactory,
  inputOtp as inputOtpFactory,
  toggleGroup as toggleGroupFactory,
  menubar as menubarFactory,
  carousel as carouselFactory,
  command as commandFactory,
  resizable as resizableFactory,
  scrollArea as scrollAreaFactory,
  viewportEnter as viewportEnterFactory,
  keybind as keybindFactory,
  kbd as kbdFactory,
  sheet as sheetFactory,
  drawer as drawerFactory,
  tabs as tabsFactory,
  accordion as accordionFactory,
  collapsible as collapsibleFactory,
  confirm as confirmFactory,
  prompt as promptFactory,
  choose as chooseFactory,
  app as appFactory,
  markdown as markdownFactory,
  html as htmlFactory,
  image as imageFactory,
  iframe as iframeFactory,
  upload as uploadFactory,
  rating as ratingFactory,
  colorPicker as colorPickerFactory,
  tags as tagsFactory,
  codeBlock as codeBlockFactory,
  tree as treeFactory,
  editor as editorFactory,
  kanban as kanbanFactory,
  relativeTime as relativeTimeFactory,
  qrCode as qrCodeFactory,
  imageZoom as imageZoomFactory,
  list as listFactory,
  imageCrop as imageCropFactory,
  gantt as ganttFactory,
  chart as chartNamespace,
  table as tableFactory,
  flow as flowFactory,
  ai as aiNamespace,
  AiChatElement,
  type ButtonProps,
  type IconButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type LabelProps,
  type InputProps,
  type CheckboxProps,
  type SwitchProps,
  type SelectProps,
  type RadioGroupProps,
  type ComboboxProps,
  type DateProps,
  type DateRangeProps,
  type DateRangePreset,
  type TimelineProps,
  type TimelineItem,
  type TimelineItemStatus,
  type StepperProps,
  type StepperStepOptions,
  type StepperStepStatus,
  type TooltipProps,
  type AvatarProps,
  type SkeletonProps,
  type SliderProps,
  type TextAreaProps,
  type LinkProps,
  type BadgeProps,
  type AlertProps,
  type SpinnerProps,
  type ProgressProps,
  type SeparatorProps,
  type IconProps,
  type IconTextProps,
  type IconSlotProps,
  type StatusDotProps,
  type StatusDotColor,
  type FeedRowProps,
  type FeedRowStatus,
  type FeedListProps,
  type ButtonGroupProps,
  type ButtonGroupOrientation,
  type EmptyProps,
  type PaginationProps,
  type FilterBarProps,
  type FilterChip,
  type NumberFieldProps,
  type PhoneInputProps,
  type PhoneCountry,
  type FieldProps,
  type FieldOrientation,
  type NativeSelectProps,
  type NativeSelectOption,
  type NavigationMenuProps,
  type NavigationMenuLinkItem,
  type NoticeProps,
  type NoticeVariant,
  type EventCalendarProps,
  type EventCalendarEvent,
  type InputGroupProps,
  type ToggleControlProps,
  type ToggleControlVariant,
  type ToggleControlSize,
  type DescriptionListProps,
  type DescriptionListItem,
  type StaticTableProps,
  type StaticTableColumn,
  type AspectRatioProps,
  type ItemListProps,
  type ItemListEntry,
  type CheckboxGroupProps,
  type CheckboxGroupOption,
  type StatItem,
  type DataTableProps,
  type DataTableAction,
  type DataTableView,
  type DataTableGroup,
  type DataTablePrimaryAction,
  type DataTableFacetOption,
  type DataTableDensity,
  type DataTableSort,
  type DataTableSortDir,
  type DataTableQuery,
  type TableColumn,
  type TableColumnFilter,
  type TableColumnEditor,
  type TableColumnPin,
  type TableColumnAggregate,
  type AreaChartProps,
  type AreaChartSeries,
  type BarChartProps,
  type BarChartSeries,
  type LineChartProps,
  type LineChartSeries,
  type PieChartProps,
  type PieChartSeries,
  type RadarChartProps,
  type RadarChartSeries,
  type RadialChartProps,
  type RadialChartSeries,
  type ScatterChartProps,
  type ScatterChartSeries,
  type ComposedChartProps,
  type ComposedChartSeries,
  type ComposedSeriesType,
  type CartesianChartProps,
  type ChartSeries,
  type ChartHeadline,
  type ChartPeriod,
  type ChartReferenceLine,
  type ChartReferenceArea,
  type SparklineProps,
  type CardProps,
  type DialogProps,
  type DialogStackProps,
  type DialogStackStepOptions,
  type AlertDialogProps,
  type DropdownMenuProps,
  type DropdownItemOptions,
  type ContextMenuProps,
  type ContextMenuItemOptions,
  type HoverCardProps,
  type HoverCardSide,
  type PopoverProps,
  type InputOtpProps,
  type ToggleGroupProps,
  type ToggleGroupType,
  type ToggleItemOptions,
  type MenubarProps,
  type MenubarItemOptions,
  type MenubarCheckboxOptions,
  type MenubarRadioGroupOptions,
  type MenubarRadioItemOptions,
  type CarouselProps,
  type CarouselOrientation,
  type CommandProps,
  type CommandMode,
  type CommandItemOptions,
  type ResizableProps,
  type ResizableOrientation,
  type ResizablePanelProps,
  type ResizableHandleProps,
  type ScrollAreaProps,
  type ViewportEnterProps,
  type ViewportEnterRoot,
  type KeybindProps,
  type KbdProps,
  type BreadcrumbItem,
  type BreadcrumbProps,
  type SheetProps,
  type SheetSide,
  type DrawerProps,
  type DrawerDirection,
  type TabsProps,
  type TabPanelOptions,
  type AccordionProps,
  type AccordionType,
  type AccordionItemOptions,
  type CollapsibleProps,
  type ConfirmOptions,
  type PromptOptions,
  type ChooseOptions,
  type ChooseOption,
  type AppProps,
  type AppNavItem,
  type AppPrimaryAction,
  type AppUser,
  type MarkdownProps,
  type HtmlProps,
  type ImageProps,
  type IframeProps,
  type UploadProps,
  type UploadVariant,
  type UploadedFile,
  type UploadProgress,
  type RatingProps,
  type ColorPickerProps,
  type TagsProps,
  type TagsOption,
  type CodeBlockProps,
  type TreeProps,
  type TreeNode,
  type EditorProps,
  type EditorFormat,
  KanbanElement,
  KANBAN_DETAIL_FIELD,
  type KanbanProps,
  type KanbanColumn,
  type KanbanCard,
  type KanbanLane,
  type KanbanCardMovePayload,
  type RelativeTimeProps,
  type RelativeTimeTimezone,
  type RelativeTimeDateStyle,
  type RelativeTimeTimeStyle,
  type QrCodeProps,
  type QrCodeLevel,
  type ImageZoomProps,
  ListElement,
  type ListProps,
  type ListGroup,
  type ListItem,
  type ListItemMovePayload,
  type ImageCropProps,
  type ImageCropPayload,
  GanttElement,
  type GanttProps,
  type GanttRow,
  type GanttItem,
  type GanttMarker,
  type GanttDependency,
  type GanttRange,
  type GanttItemMovePayload,
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
  makeFlowEdgeId,
  computeFlowLayout,
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
  type SeriesInput,
  type ChartChromeOpts,
  type PieRowKeys,
  type RadialRowKeys,
  type StackedGaugeOpts,
  type ComposedTerminalOpts,
  type PageSizeOptions,
  type GroupByOptions,
  DataTableElement,
  TableBuilder,
  DialogElement,
  DialogStackElement,
  StepperElement,
  NavigationMenuElement,
  AlertDialogElement,
  DropdownMenuElement,
  ContextMenuElement,
  PopoverElement,
  ToggleGroupElement,
  MenubarElement,
  MenubarMenuElement,
  MenubarRadioGroupElement,
  CarouselElement,
  CommandElement,
  CommandGroupElement,
  ResizableElement,
  SheetElement,
  DrawerElement,
  TabsElement,
  AccordionElement,
  CollapsibleElement,
  FlowElement,
} from '@close-by/clay-components';
import {
  Element,
  RefreshableElement,
  AutoElement,
  page as corePage,
  getPage,
  notify as notifyCore,
  navigate as navigateCore,
  reconnect as reconnectCore,
  download as downloadCore,
  clipboard as clipboardCore,
  runJavaScript as runJavaScriptCore,
  getUrlHash as getUrlHashCore,
  setUrlHash as setUrlHashCore,
  openExternal as openExternalCore,
  scroll as scrollCore,
  timer as timerCore,
  storage as storageCore,
  theme as themeCore,
  reactive as reactiveCore,
  state as stateCore,
  subscribe as subscribeCore,
  auto as autoCore,
  draft as draftCore,
  validate as validateCore,
  setPageWrapper,
  type NotifyOptions,
  type NotifyType,
  type ScrollToOptions,
  type ScrollIntoViewOptions,
  type FieldRule,
  type PageOptions,
  type PageFn,
  type ToastPosition,
  TimerHandle,
  type TimerOptions,
  type ThemeMode,
  type DraftStorage,
  type DraftOptions,
} from '@close-by/clay-core';
import {
  ClayServer,
  type ClayServerConfig,
  establishAuthSession as establishAuthSessionCore,
  clearAuthSession as clearAuthSessionCore,
} from '@close-by/clay-server';
import {
  loadPages,
  navFromPages,
  clearPageMeta,
  attachPageMeta,
  importFresh,
  resetPageDiscovery,
  type PageMeta,
  type NavFromPagesOptions,
} from './pages';
import { resolveClayClientDir } from './client-dir';
import {
  detectClayTailwindContent,
  ensureClayTailwindCss,
  mergeClayCss,
  type ClayTailwindOptions,
} from './tailwind';


export { resolveClayClientDir } from './client-dir';
export {
  detectClayTailwindContent,
  ensureClayTailwindCss,
  mergeClayCss,
  type ClayTailwindOptions,
  type ClayTailwindResult,
} from './tailwind';


export type {
  ButtonProps,
  IconButtonProps,
  ButtonVariant,
  ButtonSize,
  LabelProps,
  InputProps,
  CheckboxProps,
  BadgeProps,
  LinkProps,
  DataTableProps,
  DataTableAction,
  DataTableView,
  DataTableGroup,
  DataTablePrimaryAction,
  DataTableFacetOption,
  DataTableDensity,
  DataTableSort,
  DataTableSortDir,
  DataTableQuery,
  TableColumn,
  TableColumnFilter,
  TableColumnEditor,
  TableColumnPin,
  TableColumnAggregate,
  AreaChartProps,
  AreaChartSeries,
  RadarChartProps,
  RadarChartSeries,
  RadialChartProps,
  RadialChartSeries,
  DialogProps,
  DialogStackProps,
  DialogStackStepOptions,
  StepperProps,
  StepperStepOptions,
  StepperStepStatus,
  TimelineProps,
  TimelineItem,
  TimelineItemStatus,
  DateRangeProps,
  DateRangePreset,
  AlertDialogProps,
  DropdownMenuProps,
  DropdownItemOptions,
  BreadcrumbItem,
  BreadcrumbProps,
  SheetProps,
  SheetSide,
  DrawerProps,
  DrawerDirection,
  TabsProps,
  TabPanelOptions,
  AccordionProps,
  AccordionType,
  AccordionItemOptions,
  CollapsibleProps,
  KeybindProps,
  KbdProps,
  SwitchProps,
  RadioGroupProps,
  ComboboxProps,
  DateProps,
  TooltipProps,
  AvatarProps,
  SkeletonProps,
  SpinnerProps,
  ProgressProps,
  SeparatorProps,
  IconProps,
  ConfirmOptions,
  PromptOptions,
  ChooseOptions,
  ChooseOption,
  AppProps,
  AppNavItem,
  AppPrimaryAction,
  AppUser,
  MarkdownProps,
  HtmlProps,
  ImageProps,
  IframeProps,
  ViewportEnterProps,
  ViewportEnterRoot,
  UploadProps,
  UploadVariant,
  UploadedFile,
  RatingProps,
  ColorPickerProps,
  TagsProps,
  TagsOption,
  CodeBlockProps,
  TreeProps,
  TreeNode,
  EditorProps,
  EditorFormat,
  KanbanProps,
  KanbanColumn,
  KanbanCard,
  KanbanLane,
  KanbanCardMovePayload,
  RelativeTimeProps,
  RelativeTimeTimezone,
  RelativeTimeDateStyle,
  RelativeTimeTimeStyle,
  QrCodeProps,
  QrCodeLevel,
  ImageZoomProps,
  ListProps,
  ListGroup,
  ListItem,
  ListItemMovePayload,
  ImageCropProps,
  ImageCropPayload,
  GanttProps,
  GanttRow,
  GanttItem,
  GanttMarker,
  GanttDependency,
  GanttRange,
  GanttItemMovePayload,
  FlowProps,
  FlowNodeProps,
  FlowNodeKind,
  FlowEdge,
  FlowEdgePathType,
  FlowEdgeVariant,
  FlowHandle,
  FlowHandlePosition,
  FlowPosition,
  FlowConnectPayload,
  FlowNodeMovePayload,
  FlowSelectionPayload,
  FlowLayoutOptions,
  FlowLayoutNodeMeta,
  FlowLayoutDirection,
  AiLoaderProps,
  AiLoaderVariant,
  AiThinkingProps,
  AiMessageProps,
  AiChatProps,
  AiPromptBarProps,
  AiPromptBarVariant,
  AiCodeBlockProps,
  AiApprovalProps,
  AiToolChipsProps,
  AiTasksProps,
  AiRecommendationProps,
  AiContextProps,
  AiDiffTableProps,
  AiInsightsProps,
  AiSelectionActionsProps,
  AiFineTuneProps,
  AiIdLabel,
  AiThinkingKind,
  AiThinkingStep,
  AiMessageRole,
  AiMessageSource,
  AiMessageAction,
  AiChatMessage,
  AiChatTab,
  AiTaskStatus,
  AiTask,
  AiToolChip,
  AiApprovalOption,
  AiRecommendationAlternative,
  AiContextChunk,
  AiDiffRow,
  AiDiffColumn,
  AiInsight,
  AiSelectionAction,
  AiFineTuneField,
  SeriesInput,
  ChartChromeOpts,
  PieRowKeys,
  RadialRowKeys,
  StackedGaugeOpts,
  PageSizeOptions,
  GroupByOptions,
  NotifyOptions,
  NotifyType,
  ToastPosition,
  ThemeMode,
  PageMeta,
  NavFromPagesOptions,
  PageOptions,
  PageFn,
  TimerOptions,
  FieldRule,
  DraftStorage,
  DraftOptions,
};
export {
  DataTableElement,
  TableBuilder,
  DialogElement,
  DialogStackElement,
  StepperElement,
  NavigationMenuElement,
  AlertDialogElement,
  DropdownMenuElement,
  SheetElement,
  DrawerElement,
  TabsElement,
  AccordionElement,
  CollapsibleElement,
  FlowElement,
  KanbanElement,
  KANBAN_DETAIL_FIELD,
  ListElement,
  GanttElement,
  AiChatElement,
  makeFlowEdgeId,
  computeFlowLayout,
  TimerHandle,
  loadPages,
  navFromPages,
  clearPageMeta,
  attachPageMeta,
  importFresh,
  resetPageDiscovery,
};

/** Text label. Prefer `ui.label`. See {@link LabelProps}. */
export function label(text?: string | (() => string), props?: Omit<LabelProps, 'text'>): Element {
  return labelFactory(text, props);
}

/** Clickable button. Prefer `ui.button`. See {@link ButtonProps}. */
export function button(
  text?: string | (() => string),
  props?: Omit<ButtonProps, 'text'>,
): Element {
  return buttonFactory(text, props);
}

/** Button with a Lucide icon (label optional). Prefer `ui.iconButton`. See {@link IconButtonProps}. */
export function iconButton(props: IconButtonProps): Element {
  return iconButtonFactory(props);
}

/** Text input. Prefer `ui.input`. See {@link InputProps}. */
export function input(props?: InputProps): Element {
  return inputFactory(props);
}

/** Checkbox control. Prefer `ui.checkbox`. See {@link CheckboxProps}. */
export function checkbox(props?: CheckboxProps): Element {
  return checkboxFactory(props);
}

/** Bound boolean toggle. Prefer `ui.switch`. See {@link SwitchProps}. */
export function switch_(props?: SwitchProps): Element {
  return switchFactory(props);
}

/** Bound boolean toggle (`ui.switch`). */
export { switch_ as switch };

/** Select dropdown. Prefer `ui.select`. See {@link SelectProps}. */
export function select(props: SelectProps): Element {
  return selectFactory(props);
}

/** Radio group. Prefer `ui.radioGroup`. See {@link RadioGroupProps}. */
export function radioGroup(props: RadioGroupProps): Element {
  return radioGroupFactory(props);
}

/** Searchable combobox. Prefer `ui.combobox`. See {@link ComboboxProps}. */
export function combobox(props: ComboboxProps): Element {
  return comboboxFactory(props);
}

/** Date picker. Prefer `ui.date`. See {@link DateProps}. */
export function date(props?: DateProps): Element {
  return dateFactory(props);
}

/** Date range picker with presets. Prefer `ui.dateRange`. See {@link DateRangeProps}. */
export function dateRange(props?: DateRangeProps): Element {
  return dateRangeFactory(props);
}

/** Chronological events for feeds and deploy logs. See {@link TimelineProps}. */
export function timeline(props: TimelineProps): Element {
  return timelineFactory(props);
}

/** Inline multi-step flow with step panels. See {@link StepperProps}. */
export function stepper(
  fn: (s: StepperElement) => void,
  props?: StepperProps,
): StepperElement;
export function stepper(
  props: StepperProps,
  fn: (s: StepperElement) => void,
): StepperElement;
export function stepper(a: any, b?: any): StepperElement {
  return stepperFactory(a, b);
}

/** Tooltip around content (`fn` or props-first). Prefer `ui.tooltip`. See {@link TooltipProps}. */
export function tooltip(fn: () => void, props: TooltipProps): Element;
export function tooltip(props: TooltipProps, fn: () => void): Element;
export function tooltip(a: any, b: any): Element {
  return tooltipFactory(a, b);
}

/** Avatar image/fallback. Prefer `ui.avatar`. See {@link AvatarProps}. */
export function avatar(props?: AvatarProps): Element {
  return avatarFactory(props);
}

/** Loading placeholder. Prefer `ui.skeleton`. See {@link SkeletonProps}. */
export function skeleton(props?: SkeletonProps): Element {
  return skeletonFactory(props);
}

/** Range slider. Prefer `ui.slider`. See {@link SliderProps}. */
export function slider(props?: SliderProps): Element {
  return sliderFactory(props);
}

/** Multi-line text input. Prefer `ui.textArea`. See {@link TextAreaProps}. */
export function textArea(props?: TextAreaProps): Element {
  return textAreaFactory(props);
}

/** Anchor / client navigate link. Prefer `ui.link`. See {@link LinkProps}. */
export function link(text: string, href: string, props?: Omit<LinkProps, 'href' | 'text'>): Element {
  return linkFactory(text, href, props);
}

/** Open `url` in a new tab (`target=_blank`). Prefer `ui.externalLink`. */
export function externalLink(
  text: string,
  url: string,
  props?: Omit<LinkProps, 'href' | 'text' | 'external'>,
): Element {
  return externalLinkFactory(text, url, props);
}

/** Small status badge. Prefer `ui.badge`. See {@link BadgeProps}. */
export function badge(
  text?: string | (() => string) | BadgeProps,
  props?: Omit<BadgeProps, 'text'>,
): Element {
  return badgeFactory(text as Parameters<typeof badgeFactory>[0], props);
}

/**
 * Icon button that copies `content` via `ui.clipboard` and notifies on success.
 * Prefer over `navigator.clipboard` in page code.
 *
 * @example
 * ui.copyButton(orderId);
 * ui.copyButton(orderId, { label: 'Copy id', size: 'sm' });
 */
export function copyButton(
  content: string,
  props: Omit<IconButtonProps, 'icon' | 'onClick'> & { notifyMessage?: string } = {},
): Element {
  const { notifyMessage, label, ...rest } = props;
  return iconButtonFactory({
    ...rest,
    icon: 'copy',
    label,
    onClick: () => {
      clipboardCore(content);
      notifyCore(notifyMessage ?? 'Copied', 'success');
    },
  });
}

/** Inline alert banner. Prefer `ui.alert`. See {@link AlertProps}. */
export function alert(message?: string, props?: Omit<AlertProps, 'message'>): Element {
  return alertFactory(message, props);
}

/** Loading spinner. Prefer `ui.spinner`. See {@link SpinnerProps}. */
export function spinner(props?: SpinnerProps): Element {
  return spinnerFactory(props);
}

/** Progress bar (`value` 0–100). Prefer `ui.progress`. See {@link ProgressProps}. */
export function progress(props?: ProgressProps): Element {
  return progressFactory(props);
}

/** Horizontal/vertical rule. Prefer `ui.separator`. See {@link SeparatorProps}. */
export function separator(props?: SeparatorProps): Element {
  return separatorFactory(props);
}

/** Lucide icon by kebab-case name (full set in client). Prefer `ui.icon`. See {@link IconProps}. */
export function icon(name: string, props?: Omit<IconProps, 'name'>): Element {
  return iconFactory(name, props);
}

/** Inline icon + text (replaces manual `ui.row` + `ui.icon` + `ui.label`). See {@link IconTextProps}. */
export function iconText(
  text?: string | (() => string),
  props?: Omit<IconTextProps, 'text'>,
): Element {
  return iconTextFactory(text, props);
}

/** Status dot (or icon) + label for feeds and tables. See {@link StatusDotProps}. */
export function statusDot(props?: StatusDotProps): Element {
  return statusDotFactory(props);
}

/** Bordered container for live feed rows. See {@link FeedListProps}. */
export function feedList(props: FeedListProps, fn: () => void): Element;
export function feedList(fn: () => void): Element;
export function feedList(
  propsOrFn: FeedListProps | (() => void),
  fn?: () => void,
): Element {
  if (typeof propsOrFn === 'function') {
    return feedListFactory(propsOrFn);
  }
  return feedListFactory(propsOrFn, fn!);
}

/** One live-feed row (status, link title, meta/issue, trailing time). See {@link FeedRowProps}. */
export function feedRow(props: FeedRowProps, footer?: () => void): Element {
  return feedRowFactory(props, footer);
}

/** Visually grouped buttons / controls. See {@link ButtonGroupProps}. */
export function buttonGroup(fn: () => void, props?: ButtonGroupProps): Element;
export function buttonGroup(props: ButtonGroupProps, fn: () => void): Element;
export function buttonGroup(a: any, b?: any): Element {
  return buttonGroupFactory(a, b);
}

/** Centered empty state. See {@link EmptyProps}. */
export function empty(props: EmptyProps, footer?: () => void): Element {
  return emptyFactory(props, footer);
}

/** Standalone pager. See {@link PaginationProps}. */
export function pagination(props?: PaginationProps): Element {
  return paginationFactory(props);
}

/** Ops filter toolbar with chips + control slot. See {@link FilterBarProps}. */
export function filterBar(fn: () => void, props?: FilterBarProps): Element;
export function filterBar(props: FilterBarProps, fn: () => void): Element;
export function filterBar(a: any, b?: any): Element {
  return filterBarFactory(a, b);
}

/** Removable filter chips row. */
export function filterChips(props: Parameters<typeof filterChipsFactory>[0]): Element {
  return filterChipsFactory(props);
}

/** Numeric input with steppers. See {@link NumberFieldProps}. */
export function numberField(props?: NumberFieldProps): Element {
  return numberFieldFactory(props);
}

/** Country dial code + phone number. See {@link PhoneInputProps}. */
export function phoneInput(props?: PhoneInputProps): Element {
  return phoneInputFactory(props);
}

/** Label + description + error field wrapper. See {@link FieldProps}. */
export function field(fn: () => void, props?: FieldProps): Element;
export function field(props: FieldProps, fn: () => void): Element;
export function field(a: any, b?: any): Element {
  return fieldFactory(a, b);
}

/** Styled native `<select>`. See {@link NativeSelectProps}. */
export function nativeSelect(props: NativeSelectProps): Element {
  return nativeSelectFactory(props);
}

/** Top navigation mega-menu. See {@link NavigationMenuProps}. */
export function navigationMenu(
  fn: (menu: NavigationMenuElement) => void,
  props?: NavigationMenuProps,
): NavigationMenuElement;
export function navigationMenu(
  props: NavigationMenuProps,
  fn: (menu: NavigationMenuElement) => void,
): NavigationMenuElement;
export function navigationMenu(a: any, b?: any): NavigationMenuElement {
  return navigationMenuFactory(a, b);
}

/** Dismissible app banner. See {@link NoticeProps}. */
export function notice(message?: string | (() => string), props?: Omit<NoticeProps, 'message'>): Element {
  return noticeFactory(message, props);
}

/** Month calendar with day events. See {@link EventCalendarProps}. */
export function eventCalendar(props?: EventCalendarProps): Element {
  return eventCalendarFactory(props);
}

/** Input with prefix/suffix addons. See {@link InputGroupProps}. */
export function inputGroup(props?: InputGroupProps): Element {
  return inputGroupFactory(props);
}

/** Toolbar pressed toggle. See {@link ToggleControlProps}. */
export function toggle(props?: ToggleControlProps): Element {
  return toggleControlFactory(props);
}

/** Key-value detail rows. See {@link DescriptionListProps}. */
export function descriptionList(props: DescriptionListProps): Element {
  return descriptionListFactory(props);
}

/** Read-only HTML table. See {@link StaticTableProps}. */
export function staticTable(props: StaticTableProps): Element {
  return staticTableFactory(props);
}

/** Fixed aspect ratio wrapper. See {@link AspectRatioProps}. */
export function aspectRatio(fn: () => void, props?: AspectRatioProps): Element;
export function aspectRatio(props: AspectRatioProps, fn: () => void): Element;
export function aspectRatio(a: any, b?: any): Element {
  return aspectRatioFactory(a, b);
}

/** Settings / notification list rows. See {@link ItemListProps}. */
export function itemList(props: ItemListProps): Element {
  return itemListFactory(props);
}

/** Multi-select checkbox group. See {@link CheckboxGroupProps}. */
export function checkboxGroup(props: CheckboxGroupProps): Element {
  return checkboxGroupFactory(props);
}

/** Render markdown to HTML. Prefer `ui.markdown`. See {@link MarkdownProps}. */
export function markdown(text?: string, props?: MarkdownProps): Element {
  return markdownFactory(text, props);
}

/** Raw HTML (trusted). Prefer `ui.html`. See {@link HtmlProps}. */
export function html(content?: string, props?: HtmlProps): Element {
  return htmlFactory(content, props);
}

/** Image element. Prefer `ui.image`. See {@link ImageProps}. */
export function image(src: string, props?: ImageProps): Element {
  return imageFactory(src, props);
}

/** Iframe embed. Prefer `ui.iframe`. See {@link IframeProps}. */
export function iframe(src: string, props?: IframeProps): Element {
  return iframeFactory(src, props);
}

/** File upload control (`POST /upload`). Prefer `ui.upload`. See {@link UploadProps}. */
export function upload(props?: UploadProps): Element {
  return uploadFactory(props);
}

/** Star rating control. Prefer `ui.rating`. See {@link RatingProps}. */
export function rating(props?: RatingProps): Element {
  return ratingFactory(props);
}

/** Hex color picker. Prefer `ui.colorPicker`. See {@link ColorPickerProps}. */
export function colorPicker(props?: ColorPickerProps): Element {
  return colorPickerFactory(props);
}

/** Multi-tag chip input. Prefer `ui.tags`. See {@link TagsProps}. */
export function tags(props?: TagsProps): Element {
  return tagsFactory(props);
}

/** Read-only syntax-highlighted code block (Shiki). Prefer `ui.codeBlock`. See {@link CodeBlockProps}. */
export function codeBlock(props: CodeBlockProps): Element {
  return codeBlockFactory(props);
}

/** Nested tree with selection + expand. Prefer `ui.tree`. See {@link TreeProps}. */
export function tree(props: TreeProps): Element {
  return treeFactory(props);
}

/** Rich text editor (Domternal). Prefer `ui.editor`. See {@link EditorProps}. */
export function editor(props?: EditorProps): Element {
  return editorFactory(props);
}

/**
 * Kanban board with cross-column card drag, optional swimlanes, and card detail drawer.
 * Owns columns + card order + selection; default `cardMove` / `cardSelect` settle
 * updates the model before user callbacks. Prefer `ui.kanban`. See {@link KanbanProps}.
 */
export function kanban(props?: KanbanProps): KanbanElement {
  return kanbanFactory(props);
}

/** Multi-timezone clock (ticks when `date` omitted). Prefer `ui.relativeTime`. See {@link RelativeTimeProps}. */
export function relativeTime(props: RelativeTimeProps): Element {
  return relativeTimeFactory(props);
}

/** SVG QR code from a string. Prefer `ui.qrCode`. See {@link QrCodeProps}. */
export function qrCode(props: QrCodeProps): Element {
  return qrCodeFactory(props);
}

/** Image with click-to-zoom overlay. Prefer `ui.imageZoom`. See {@link ImageZoomProps}. */
export function imageZoom(props: ImageZoomProps): Element {
  return imageZoomFactory(props);
}

/**
 * Dense vertical grouped DnD list. Owns groups + item order;
 * default `itemMove` settle updates the model before user `onItemMove`.
 * Prefer `ui.list`. See {@link ListProps}.
 */
export function list(props?: ListProps): ListElement {
  return listFactory(props);
}

/** Interactive image cropper (emits data URL). Prefer `ui.imageCrop`. See {@link ImageCropProps}. */
export function imageCrop(props: ImageCropProps): Element {
  return imageCropFactory(props);
}

/**
 * Project timeline with drag move/resize (including cross-row), markers,
 * and dependency arrows. Owns rows + dates + markers + dependencies;
 * default `itemMove` / `markerAdd` settle updates the model before user callbacks.
 * Prefer `ui.gantt`. See {@link GanttProps}.
 */
export function gantt(props?: GanttProps): GanttElement {
  return ganttFactory(props);
}

/**
 * Interactive flow diagram (`@xyflow/react`). Owns edges + positions;
 * node bodies are Clay trees; drag by card chrome (controls are nodrag);
 * default settle handlers update the owned model before user `on*`.
 * Prefer `ui.flow`. See {@link FlowProps}.
 */
export function flow(fn: (f: FlowElement) => void, props?: FlowProps): FlowElement;
export function flow(props: FlowProps, fn: (f: FlowElement) => void): FlowElement;
export function flow(a: any, b?: any): FlowElement {
  return flowFactory(a, b);
}

/** Stat strip (label/value items). Prefer `ui.stat`. */
export function stat(items: StatItem[], props?: { className?: string }): Element {
  return statFactory(items, props);
}

/** Data grid with sort/filter/actions. Prefer `ui.dataTable`. See {@link DataTableProps}. */
export function dataTable(data?: unknown, props?: DataTableProps): DataTableElement {
  return dataTableFactory(data, props);
}

/** Staged DataTable builder — optional sugar over `ui.dataTable`. */
export function table(data?: unknown): TableBuilder {
  return tableFactory(data);
}

/** Mode-first chart builders — optional sugar over `ui.areaChart` / `pieChart` / etc. */
export const chart = chartNamespace;

/**
 * AI-native visual primitives (`ui.ai.chat`, `ui.ai.promptBar`, …).
 * Props + events only — no model / streaming runtime.
 */
export const ai = aiNamespace;

/** Area chart. Prefer `ui.areaChart`. See {@link AreaChartProps}. */
export function areaChart(props: AreaChartProps): Element {
  return areaChartFactory(props);
}

/** Bar chart. Prefer `ui.barChart`. See {@link BarChartProps}. */
export function barChart(props: BarChartProps): Element {
  return barChartFactory(props);
}

/** Line chart. Prefer `ui.lineChart`. See {@link LineChartProps}. */
export function lineChart(props: LineChartProps): Element {
  return lineChartFactory(props);
}

/** Pie / donut chart. Prefer `ui.pieChart`. See {@link PieChartProps}. */
export function pieChart(props: PieChartProps): Element {
  return pieChartFactory(props);
}

/** Radar chart. Prefer `ui.radarChart`. See {@link RadarChartProps}. */
export function radarChart(props: RadarChartProps): Element {
  return radarChartFactory(props);
}

/** Radial / gauge chart. Prefer `ui.radialChart`. See {@link RadialChartProps}. */
export function radialChart(props: RadialChartProps): Element {
  return radialChartFactory(props);
}

/** Scatter chart. Prefer `ui.scatterChart`. See {@link ScatterChartProps}. */
export function scatterChart(props: ScatterChartProps): Element {
  return scatterChartFactory(props);
}

/** Composed multi-geometry chart. Prefer `ui.composedChart`. See {@link ComposedChartProps}. */
export function composedChart(props: ComposedChartProps): Element {
  return composedChartFactory(props);
}

/** KPI card with inline sparkline. Prefer `ui.sparkline`. See {@link SparklineProps}. */
export function sparkline(props: SparklineProps): Element {
  return sparklineFactory(props);
}

/** Horizontal flex row (`fn` or props-first). Prefer `ui.row`. */
export function row(fn: () => void, props?: Parameters<typeof rowFactory>[1]): Element;
export function row(props: Parameters<typeof rowFactory>[0], fn: () => void): Element;
export function row(a: any, b?: any): Element {
  return rowFactory(a, b);
}

/** Vertical flex column (`fn` or props-first). Prefer `ui.column`. */
export function column(fn: () => void, props?: Parameters<typeof columnFactory>[1]): Element;
export function column(props: Parameters<typeof columnFactory>[0], fn: () => void): Element;
export function column(a: any, b?: any): Element {
  return columnFactory(a, b);
}

/** Layout container (`fn` or props-first). Prefer `ui.container`. */
export function container(fn: () => void, props?: Parameters<typeof containerFactory>[1]): Element;
export function container(props: Parameters<typeof containerFactory>[0], fn: () => void): Element;
export function container(a: any, b?: any): Element {
  return containerFactory(a, b);
}

/** Hero section (`fn` or props-first). Prefer `ui.hero`. */
export function hero(fn: () => void, props?: Parameters<typeof heroFactory>[1]): Element;
export function hero(props: Parameters<typeof heroFactory>[0], fn: () => void): Element;
export function hero(a: any, b?: any): Element {
  return heroFactory(a, b);
}

/** Card with optional header/footer (`fn` or props-first). Prefer `ui.card`. See {@link CardProps}. */
export function card(fn: (card: Element) => void, props?: CardProps): Element;
export function card(props: CardProps, fn: (card: Element) => void): Element;
export function card(a: any, b?: any): Element {
  return cardFactory(a, b);
}

/** App shell (sidebar + header). Prefer `ui.app`, or pass via `ui.run({ app })`. See {@link AppProps}. */
export function app(props: AppProps, fn: () => void): Element {
  return appFactory(props, fn);
}

/** Modal dialog (`fn` or props-first). Prefer `ui.dialog`. See {@link DialogProps}. */
export function dialog(fn: (dlg: DialogElement) => void, props?: DialogProps): DialogElement;
export function dialog(props: DialogProps, fn: (dlg: DialogElement) => void): DialogElement;
export function dialog(a: any, b?: any): DialogElement {
  return dialogFactory(a, b);
}

/** Stacked multi-step dialog (`fn` or props-first). Prefer `ui.dialogStack`. See {@link DialogStackProps}. */
export function dialogStack(
  fn: (stack: DialogStackElement) => void,
  props?: DialogStackProps,
): DialogStackElement;
export function dialogStack(
  props: DialogStackProps,
  fn: (stack: DialogStackElement) => void,
): DialogStackElement;
export function dialogStack(a: any, b?: any): DialogStackElement {
  return dialogStackFactory(a, b);
}

/** Alert / confirm dialog. Prefer `ui.alertDialog`. See {@link AlertDialogProps}. */
export function alertDialog(props?: AlertDialogProps): AlertDialogElement {
  return alertDialogFactory(props);
}

/** Dropdown menu (`fn` or props-first). Prefer `ui.dropdownMenu`. See {@link DropdownMenuProps}. */
export function dropdownMenu(
  fn: (m: DropdownMenuElement) => void,
  props?: DropdownMenuProps,
): DropdownMenuElement;
export function dropdownMenu(
  props: DropdownMenuProps,
  fn: (m: DropdownMenuElement) => void,
): DropdownMenuElement;
export function dropdownMenu(a: any, b?: any): DropdownMenuElement {
  return dropdownMenuFactory(a, b);
}

/** Right-click context menu. Prefer `ui.contextMenu`. See {@link ContextMenuProps}. */
export function contextMenu(
  fn: (m: ContextMenuElement) => void,
  props?: ContextMenuProps,
): ContextMenuElement;
export function contextMenu(
  props: ContextMenuProps,
  fn: (m: ContextMenuElement) => void,
): ContextMenuElement;
export function contextMenu(a: any, b?: any): ContextMenuElement {
  return contextMenuFactory(a, b);
}

/** Hover card (`fn` or props-first). Prefer `ui.hoverCard`. See {@link HoverCardProps}. */
export function hoverCard(fn: () => void, props: HoverCardProps): Element;
export function hoverCard(props: HoverCardProps, fn: () => void): Element;
export function hoverCard(a: any, b: any): Element {
  return hoverCardFactory(a, b);
}

/** Popover (`fn` or props-first). Prefer `ui.popover`. See {@link PopoverProps}. */
export function popover(fn: (p: PopoverElement) => void, props?: PopoverProps): PopoverElement;
export function popover(props: PopoverProps, fn: (p: PopoverElement) => void): PopoverElement;
export function popover(a: any, b?: any): PopoverElement {
  return popoverFactory(a, b);
}

/** One-time-password / digit inputs. Prefer `ui.inputOtp`. See {@link InputOtpProps}. */
export function inputOtp(props?: InputOtpProps): Element {
  return inputOtpFactory(props);
}

/** Toggle button group. Prefer `ui.toggleGroup`. See {@link ToggleGroupProps}. */
export function toggleGroup(
  fn: (g: ToggleGroupElement) => void,
  props?: ToggleGroupProps,
): ToggleGroupElement;
export function toggleGroup(
  props: ToggleGroupProps,
  fn: (g: ToggleGroupElement) => void,
): ToggleGroupElement;
export function toggleGroup(a: any, b?: any): ToggleGroupElement {
  return toggleGroupFactory(a, b);
}

/** Menubar. Prefer `ui.menubar`. See {@link MenubarProps}. */
export function menubar(
  fn: (m: MenubarElement) => void,
  props?: MenubarProps,
): MenubarElement;
export function menubar(
  props: MenubarProps,
  fn: (m: MenubarElement) => void,
): MenubarElement;
export function menubar(a: any, b?: any): MenubarElement {
  return menubarFactory(a, b);
}

/** Carousel. Prefer `ui.carousel`. See {@link CarouselProps}. */
export function carousel(
  fn: (c: CarouselElement) => void,
  props?: CarouselProps,
): CarouselElement;
export function carousel(
  props: CarouselProps,
  fn: (c: CarouselElement) => void,
): CarouselElement;
export function carousel(a: any, b?: any): CarouselElement {
  return carouselFactory(a, b);
}

/** Command palette / searchable list. Prefer `ui.command`. See {@link CommandProps}. */
export function command(
  fn: (c: CommandElement) => void,
  props?: CommandProps,
): CommandElement;
export function command(
  props: CommandProps,
  fn: (c: CommandElement) => void,
): CommandElement;
export function command(a: any, b?: any): CommandElement {
  return commandFactory(a, b);
}

/** Resizable split panes. Prefer `ui.resizable`. See {@link ResizableProps}. */
export function resizable(
  fn: (r: ResizableElement) => void,
  props?: ResizableProps,
): ResizableElement;
export function resizable(
  props: ResizableProps,
  fn: (r: ResizableElement) => void,
): ResizableElement;
export function resizable(a: any, b?: any): ResizableElement {
  return resizableFactory(a, b);
}

/** Scrollable region (`fn` or props-first). Prefer `ui.scrollArea`. See {@link ScrollAreaProps}. */
export function scrollArea(fn: () => void, props?: ScrollAreaProps): Element;
export function scrollArea(props: ScrollAreaProps, fn: () => void): Element;
export function scrollArea(a: any, b?: any): Element {
  return scrollAreaFactory(a, b);
}

/**
 * Observe when children enter the viewport (IntersectionObserver).
 * Prefer `ui.viewportEnter`. See {@link ViewportEnterProps}.
 *
 * @example
 * ```ts
 * ui.viewportEnter({ onEnter: () => void loadMore(), once: true }, () => {
 *   ui.label('Lazy section');
 * });
 * ```
 */
export function viewportEnter(fn: () => void, props?: ViewportEnterProps): Element;
export function viewportEnter(props: ViewportEnterProps, fn: () => void): Element;
export function viewportEnter(a: any, b?: any): Element {
  return viewportEnterFactory(a, b);
}

/**
 * Headless keyboard chord listener. Prefer `ui.keybind`. See {@link KeybindProps}.
 *
 * @example
 * ```ts
 * ui.keybind({
 *   keys: 'mod+s',
 *   onPress: async () => {
 *     await save();
 *     ui.notify('Saved', 'success');
 *   },
 * });
 * ```
 */
export function keybind(props: KeybindProps): Element {
  return keybindFactory(props);
}

/**
 * Display-only keyboard chord glyphs. Prefer `ui.kbd`. See {@link KbdProps}.
 * Pair with `ui.keybind` for the actual listener.
 *
 * @example
 * ```ts
 * ui.kbd('mod+k');
 * ui.kbd({ keys: 'mod+s', className: 'ml-1' });
 * ui.kbd(['mod+k', 'ctrl+k']);
 * ```
 */
export function kbd(keys: string | string[], props?: Omit<KbdProps, 'keys'>): Element;
export function kbd(props: KbdProps): Element;
export function kbd(a: any, b?: any): Element {
  return kbdFactory(a, b);
}

/** Breadcrumb trail. Prefer `ui.breadcrumb`. See {@link BreadcrumbProps}. */
export function breadcrumb(items: BreadcrumbItem[], props?: BreadcrumbProps): Element {
  return breadcrumbFactory(items, props);
}

/** Side sheet panel. Prefer `ui.sheet`. See {@link SheetProps}. */
export function sheet(fn: (s: SheetElement) => void, props?: SheetProps): SheetElement;
export function sheet(props: SheetProps, fn: (s: SheetElement) => void): SheetElement;
export function sheet(a: any, b?: any): SheetElement {
  return sheetFactory(a, b);
}

/** Drawer panel. Prefer `ui.drawer`. See {@link DrawerProps}. */
export function drawer(fn: (d: DrawerElement) => void, props?: DrawerProps): DrawerElement;
export function drawer(props: DrawerProps, fn: (d: DrawerElement) => void): DrawerElement;
export function drawer(a: any, b?: any): DrawerElement {
  return drawerFactory(a, b);
}

/** Tabs. Prefer `ui.tabs`. See {@link TabsProps}. */
export function tabs(fn: (t: TabsElement) => void, props?: TabsProps): TabsElement;
export function tabs(props: TabsProps, fn: (t: TabsElement) => void): TabsElement;
export function tabs(a: any, b?: any): TabsElement {
  return tabsFactory(a, b);
}

/** Accordion. Prefer `ui.accordion`. See {@link AccordionProps}. */
export function accordion(fn: (a: AccordionElement) => void, props?: AccordionProps): AccordionElement;
export function accordion(props: AccordionProps, fn: (a: AccordionElement) => void): AccordionElement;
export function accordion(a: any, b?: any): AccordionElement {
  return accordionFactory(a, b);
}

/** Collapsible section. Prefer `ui.collapsible`. See {@link CollapsibleProps}. */
export function collapsible(fn: (c: CollapsibleElement) => void, props?: CollapsibleProps): CollapsibleElement;
export function collapsible(props: CollapsibleProps, fn: (c: CollapsibleElement) => void): CollapsibleElement;
export function collapsible(a: any, b?: any): CollapsibleElement {
  return collapsibleFactory(a, b);
}

/** Confirm dialog; resolves `true`/`false`. Prefer `ui.confirm`. See {@link ConfirmOptions}. */
export function confirm(message: string, options?: ConfirmOptions): Promise<boolean> {
  return confirmFactory(message, options);
}

/** Prompt dialog; resolves string or `null` if cancelled. Prefer `ui.prompt`. See {@link PromptOptions}. */
export function prompt(message: string, options?: PromptOptions): Promise<string | null> {
  return promptFactory(message, options);
}

/** Multi-choice dialog; resolves choice id or `null`. Prefer `ui.choose`. See {@link ChooseOptions}. */
export function choose(
  message: string,
  choices: ChooseOption[],
  options?: ChooseOptions,
): Promise<string | null> {
  return chooseFactory(message, choices, options);
}

/** Toast notification. Prefer `ui.notify`. See {@link NotifyOptions}. */
export function notify(message: string, typeOrOptions?: NotifyType | NotifyOptions): void {
  notifyCore(message, typeOrOptions);
}

/** Client SPA navigate. Prefer `ui.navigate`. */
export function navigate(path: string): void {
  navigateCore(path);
}

/** Soft-reconnect so the next hello includes updated cookies. */
export function reconnect(): void {
  reconnectCore();
}

/**
 * Set the HttpOnly auth cookie (via client `POST /auth/session`) and soft-reconnect.
 * Requires `ui.run({ authSecret })`.
 */
export function establishAuthSession(
  userId: string,
  options?: { path?: string },
): void {
  establishAuthSessionCore(userId, options);
}

/**
 * Clear the auth cookie (via client `DELETE /auth/session`) and soft-reconnect.
 */
export function clearAuthSession(options?: { path?: string }): void {
  clearAuthSessionCore(options);
}

/** Trigger a browser file download. Prefer `ui.download`. */
export function download(filename: string, mime: string, content: string): void {
  downloadCore(filename, mime, content);
}

/** Copy text to the client clipboard. Prefer `ui.clipboard`. */
export function clipboard(content: string): void {
  clipboardCore(content);
}

/** URL hash without `#` (from hello / last `setUrlHash`). Prefer over `window.location`. */
export function getUrlHash(): string {
  return getUrlHashCore();
}

/** Set the browser URL hash. Prefer over `window.history` / `location.hash`. */
export function setUrlHash(hash: string): void {
  setUrlHashCore(hash);
}

/** Open a URL in a new tab. Prefer over `runJavaScript('window.open…')`. */
export function openExternal(url: string): void {
  openExternalCore(url);
}

/** Run trusted JavaScript in the connected browser. */
export function runJavaScript(code: string): void {
  runJavaScriptCore(code);
}

/** Window / element scroll helpers (`ui.scroll.to` / `ui.scroll.intoView`). */
export const scroll = scrollCore;

/**
 * Session-scoped timer. Interval is in **seconds**. Prefer `ui.timer`.
 * See {@link TimerOptions}.
 */
export function timer(
  interval: number,
  callback: () => void | Promise<void>,
  options?: TimerOptions,
): TimerHandle {
  return timerCore(interval, callback, options);
}

/** Tab + user + app storage (NiceGUI-ish). Prefer `ui.storage`. */
export const storage = storageCore;

/** Server-driven appearance (`light` | `dark` | `system`). */
export const theme = themeCore;

/** Proxy that notifies subscribers on property change. Prefer this over importing from `@close-by/clay-core`. */
export const reactive = reactiveCore;

/** Alias for `reactive` — NiceGUI-ish mutable page state. Prefer `ui.state`. */
export const state = stateCore;

/** Listen for a reactive property change. Prefer this over importing from `@close-by/clay-core`. */
export const subscribe = subscribeCore;

/**
 * Reactive object hydrated from sync storage (`tab` by default) with write-through.
 * Survives reconnect / `--reload`. Prefer `ui.draft`. See {@link DraftOptions}.
 *
 * @example
 * ```ts
 * const form = ui.draft('formDemo', { name: '', email: '' });
 * // on submit/reset:
 * ui.draft.clear('formDemo');
 * ```
 */
export const draft = draftCore;

/** Run field checks, set errors, return true if all pass. Prefer `ui.validate`. */
export function validate(rules: FieldRule[]): boolean {
  return validateCore(rules);
}

/** Manually refreshable block — call `.refresh()` to rebuild. Prefer `ui.refreshable`. */
export function refreshable(fn: () => void): RefreshableElement {
  return new RefreshableElement(fn);
}

/**
 * Auto-refreshing UI block: rebuilds when `ui.state` / `reactive` values read
 * during the builder change. Keep state outside the builder.
 */
export function auto(fn: () => void): AutoElement {
  return autoCore(fn);
}

/**
 * Register a route builder. Prefer `ui.page`.
 * See {@link PageOptions} (`shell: false` skips the global `ui.run({ app })` wrapper).
 */
export function page(path: string, fn: () => void, options?: PageOptions): void {
  corePage(path, fn, options);
}

/**
 * Server + run options for `ui.run`.
 * Extends {@link ClayServerConfig} (port, auth, storage, uploads, session timeouts).
 */
export type RunConfig = ClayServerConfig & {
  /** Global dashboard shell; wraps every page unless `ui.page(..., { shell: false })`. */
  app?: AppProps;
  /**
   * Auto-build Tailwind utilities from app modules and inject after the client CSS.
   *
   * - `undefined` — on when `pages/`, `src/`, or `app/` exists under cwd
   * - `true` — same auto-detect
   * - `false` — off
   * - object — custom `content` paths, `watch`, `appendCss`, …
   *
   * Scans `className` / `.classes(...)` strings; no app-level Tailwind config required.
   */
  tailwind?: boolean | (Omit<ClayTailwindOptions, 'content'> & { content?: string[] });
};

const pathDelimiter = process.platform === 'win32' ? ';' : ':';

function applyClayTailwind(cfg: RunConfig): RunConfig {
  if (cfg.tailwind === false || process.env.CLAY_NO_TAILWIND === '1') {
    return { ...cfg, tailwind: false };
  }

  const tw = cfg.tailwind;
  const cwd = process.cwd();
  const envContent = process.env.CLAY_TAILWIND_CONTENT?.split(pathDelimiter).filter(Boolean) ?? [];

  const opts =
    tw === undefined || tw === true
      ? {
          content: envContent.length ? envContent : detectClayTailwindContent(cwd),
          watch: process.env.CLAY_TAILWIND_WATCH === '1',
        }
      : {
          content: tw.content?.length
            ? tw.content
            : envContent.length
              ? envContent
              : detectClayTailwindContent(cwd),
          watch: tw.watch ?? process.env.CLAY_TAILWIND_WATCH === '1',
          appendCss: tw.appendCss,
          outFile: tw.outFile,
          cwd: tw.cwd ?? cwd,
        };

  if (!opts.content.length) return cfg;

  const { cssPath } = ensureClayTailwindCss({
    content: opts.content,
    cwd: opts.cwd ?? cwd,
    watch: opts.watch,
    appendCss: opts.appendCss,
    outFile: opts.outFile,
  });

  return { ...cfg, css: mergeClayCss(cfg.css, cssPath) };
}

let runCalled = false;

/** Whether `ui.run` has been invoked in this process (used by the `clay` CLI). */
export function wasRunCalled(): boolean {
  return runCalled;
}

/** Test / CLI helper: clear the run-called flag. */
export function resetRunState(): void {
  runCalled = false;
}

/**
 * Start the Clay server.
 *
 * - `ui.run(config?)` — current pages + optional global shell
 * - `ui.run(root, config?)` — NiceGUI-style root page: registers `/` if missing, then starts
 */
export function run(config?: RunConfig): ClayServer;
export function run(root: PageFn, config?: RunConfig): ClayServer;
export function run(rootOrConfig: PageFn | RunConfig = {}, config: RunConfig = {}): ClayServer {
  let root: PageFn | undefined;
  let cfg: RunConfig;

  if (typeof rootOrConfig === 'function') {
    root = rootOrConfig;
    cfg = config;
  } else {
    cfg = rootOrConfig ?? {};
  }

  if (root && !getPage('/')) {
    corePage('/', root);
  }

  if (!cfg.clientDir) {
    cfg = { ...cfg, clientDir: resolveClayClientDir() };
  }

  cfg = applyClayTailwind(cfg);

  const { app: appProps, tailwind: _tailwind, ...serverConfig } = cfg;
  if (appProps) {
    setPageWrapper((pageFn) => app(appProps, pageFn));
  } else {
    setPageWrapper(null);
  }

  runCalled = true;
  const server = new ClayServer(serverConfig);
  server.start();
  return server;
}

export const ui = {
  label,
  button,
  iconButton,
  input,
  checkbox,
  switch: switch_,
  select,
  radioGroup,
  combobox,
  date,
  dateRange,
  timeline,
  stepper,
  tooltip,
  avatar,
  skeleton,
  slider,
  textArea,
  link,
  externalLink,
  copyButton,
  badge,
  alert,
  spinner,
  progress,
  separator,
  icon,
  iconText,
  statusDot,
  feedRow,
  feedList,
  buttonGroup,
  empty,
  pagination,
  filterBar,
  filterChips,
  numberField,
  phoneInput,
  field,
  nativeSelect,
  navigationMenu,
  notice,
  eventCalendar,
  inputGroup,
  toggle,
  descriptionList,
  staticTable,
  aspectRatio,
  itemList,
  checkboxGroup,
  markdown,
  html,
  image,
  iframe,
  upload,
  rating,
  colorPicker,
  tags,
  codeBlock,
  tree,
  editor,
  kanban,
  relativeTime,
  qrCode,
  imageZoom,
  list,
  imageCrop,
  gantt,
  flow,
  stat,
  dataTable,
  table,
  chart,
  ai,
  areaChart,
  barChart,
  lineChart,
  pieChart,
  radarChart,
  radialChart,
  scatterChart,
  composedChart,
  sparkline,
  row,
  column,
  container,
  hero,
  card,
  app,
  dialog,
  dialogStack,
  alertDialog,
  dropdownMenu,
  contextMenu,
  hoverCard,
  popover,
  inputOtp,
  toggleGroup,
  menubar,
  carousel,
  command,
  resizable,
  scrollArea,
  viewportEnter,
  keybind,
  kbd,
  breadcrumb,
  sheet,
  drawer,
  tabs,
  accordion,
  collapsible,
  confirm,
  prompt,
  choose,
  notify,
  navigate,
  reconnect,
  establishAuthSession,
  clearAuthSession,
  download,
  clipboard,
  getUrlHash,
  setUrlHash,
  openExternal,
  runJavaScript,
  scroll,
  timer,
  storage,
  theme,
  reactive,
  state,
  subscribe,
  draft,
  validate,
  refreshable,
  auto,
  page,
  run,
  loadPages,
  navFromPages,
};

export default ui;
