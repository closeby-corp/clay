import {
  button as buttonFactory,
  label as labelFactory,
  input as inputFactory,
  checkbox as checkboxFactory,
  switchControl as switchFactory,
  select as selectFactory,
  radioGroup as radioGroupFactory,
  combobox as comboboxFactory,
  date as dateFactory,
  tooltip as tooltipFactory,
  avatar as avatarFactory,
  skeleton as skeletonFactory,
  slider as sliderFactory,
  textArea as textAreaFactory,
  link as linkFactory,
  badge as badgeFactory,
  alert as alertFactory,
  spinner as spinnerFactory,
  progress as progressFactory,
  separator as separatorFactory,
  icon as iconFactory,
  stat as statFactory,
  dataTable as dataTableFactory,
  areaChart as areaChartFactory,
  barChart as barChartFactory,
  lineChart as lineChartFactory,
  pieChart as pieChartFactory,
  radarChart as radarChartFactory,
  radialChart as radialChartFactory,
  row as rowFactory,
  column as columnFactory,
  container as containerFactory,
  hero as heroFactory,
  card as cardFactory,
  dialog as dialogFactory,
  alertDialog as alertDialogFactory,
  dropdownMenu as dropdownMenuFactory,
  breadcrumb as breadcrumbFactory,
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
  upload as uploadFactory,
  chart as chartNamespace,
  table as tableFactory,
  type ButtonProps,
  type LabelProps,
  type InputProps,
  type CheckboxProps,
  type SwitchProps,
  type SelectProps,
  type RadioGroupProps,
  type ComboboxProps,
  type DateProps,
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
  type StatItem,
  type DataTableProps,
  type DataTableAction,
  type DataTableView,
  type DataTableGroup,
  type DataTablePrimaryAction,
  type TableColumn,
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
  type CartesianChartProps,
  type ChartSeries,
  type CardProps,
  type DialogProps,
  type AlertDialogProps,
  type DropdownMenuProps,
  type DropdownItemOptions,
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
  type AppUser,
  type MarkdownProps,
  type HtmlProps,
  type ImageProps,
  type UploadProps,
  type UploadedFile,
  type SeriesInput,
  type ChartChromeOpts,
  type PieRowKeys,
  type RadialRowKeys,
  type StackedGaugeOpts,
  type PageSizeOptions,
  type GroupByOptions,
  DataTableElement,
  TableBuilder,
  DialogElement,
  AlertDialogElement,
  DropdownMenuElement,
  SheetElement,
  DrawerElement,
  TabsElement,
  AccordionElement,
  CollapsibleElement,
} from '@badui/components';
import {
  Element,
  RefreshableElement,
  page as corePage,
  getPage,
  notify as notifyCore,
  navigate as navigateCore,
  download as downloadCore,
  clipboard as clipboardCore,
  timer as timerCore,
  storage as storageCore,
  theme as themeCore,
  setPageWrapper,
  type NotifyOptions,
  type NotifyType,
  type PageFn,
  type PageOptions,
  type ToastPosition,
  type TimerOptions,
  type ThemeMode,
  TimerHandle,
} from '@badui/core';
import { BadUIServer, type BadUIServerConfig } from '@badui/server';
import {
  loadPages,
  navFromPages,
  clearPageMeta,
  type PageMeta,
} from './pages';

export type {
  DataTableProps,
  DataTableAction,
  DataTableView,
  DataTableGroup,
  DataTablePrimaryAction,
  TableColumn,
  AreaChartProps,
  AreaChartSeries,
  RadarChartProps,
  RadarChartSeries,
  RadialChartProps,
  RadialChartSeries,
  DialogProps,
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
  AppUser,
  MarkdownProps,
  HtmlProps,
  ImageProps,
  UploadProps,
  UploadedFile,
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
  PageOptions,
  PageFn,
  TimerOptions,
};
export {
  DataTableElement,
  TableBuilder,
  DialogElement,
  AlertDialogElement,
  DropdownMenuElement,
  SheetElement,
  DrawerElement,
  TabsElement,
  AccordionElement,
  CollapsibleElement,
  TimerHandle,
  loadPages,
  navFromPages,
  clearPageMeta,
};

export function label(text?: string, props?: Omit<LabelProps, 'text'>): Element {
  return labelFactory(text, props);
}

export function button(text?: string, props?: Omit<ButtonProps, 'text'>): Element {
  return buttonFactory(text, props);
}

export function input(props?: InputProps): Element {
  return inputFactory(props);
}

export function checkbox(props?: CheckboxProps): Element {
  return checkboxFactory(props);
}

export function switch_(props?: SwitchProps): Element {
  return switchFactory(props);
}

/** Bound boolean toggle (`ui.switch`). */
export { switch_ as switch };

export function select(props: SelectProps): Element {
  return selectFactory(props);
}

export function radioGroup(props: RadioGroupProps): Element {
  return radioGroupFactory(props);
}

export function combobox(props: ComboboxProps): Element {
  return comboboxFactory(props);
}

export function date(props?: DateProps): Element {
  return dateFactory(props);
}

export function tooltip(fn: () => void, props: TooltipProps): Element;
export function tooltip(props: TooltipProps, fn: () => void): Element;
export function tooltip(a: any, b: any): Element {
  return tooltipFactory(a, b);
}

export function avatar(props?: AvatarProps): Element {
  return avatarFactory(props);
}

export function skeleton(props?: SkeletonProps): Element {
  return skeletonFactory(props);
}

export function slider(props?: SliderProps): Element {
  return sliderFactory(props);
}

export function textArea(props?: TextAreaProps): Element {
  return textAreaFactory(props);
}

export function link(text: string, href: string, props?: Omit<LinkProps, 'href' | 'text'>): Element {
  return linkFactory(text, href, props);
}

export function badge(text?: string, props?: Omit<BadgeProps, 'text'>): Element {
  return badgeFactory(text, props);
}

export function alert(message?: string, props?: Omit<AlertProps, 'message'>): Element {
  return alertFactory(message, props);
}

export function spinner(props?: SpinnerProps): Element {
  return spinnerFactory(props);
}

export function progress(props?: ProgressProps): Element {
  return progressFactory(props);
}

export function separator(props?: SeparatorProps): Element {
  return separatorFactory(props);
}

export function icon(name: string, props?: Omit<IconProps, 'name'>): Element {
  return iconFactory(name, props);
}

export function markdown(text?: string, props?: MarkdownProps): Element {
  return markdownFactory(text, props);
}

export function html(content?: string, props?: HtmlProps): Element {
  return htmlFactory(content, props);
}

export function image(src: string, props?: ImageProps): Element {
  return imageFactory(src, props);
}

export function upload(props?: UploadProps): Element {
  return uploadFactory(props);
}

export function stat(items: StatItem[], props?: { className?: string }): Element {
  return statFactory(items, props);
}

export function dataTable(data?: unknown, props?: DataTableProps): DataTableElement {
  return dataTableFactory(data, props);
}

/** Staged DataTable builder — optional sugar over `ui.dataTable`. */
export function table(data?: unknown): TableBuilder {
  return tableFactory(data);
}

/** Mode-first chart builders — optional sugar over `ui.areaChart` / `pieChart` / etc. */
export const chart = chartNamespace;

export function areaChart(props: AreaChartProps): Element {
  return areaChartFactory(props);
}

export function barChart(props: BarChartProps): Element {
  return barChartFactory(props);
}

export function lineChart(props: LineChartProps): Element {
  return lineChartFactory(props);
}

export function pieChart(props: PieChartProps): Element {
  return pieChartFactory(props);
}

export function radarChart(props: RadarChartProps): Element {
  return radarChartFactory(props);
}

export function radialChart(props: RadialChartProps): Element {
  return radialChartFactory(props);
}

export function row(fn: () => void, props?: Parameters<typeof rowFactory>[1]): Element;
export function row(props: Parameters<typeof rowFactory>[0], fn: () => void): Element;
export function row(a: any, b?: any): Element {
  return rowFactory(a, b);
}

export function column(fn: () => void, props?: Parameters<typeof columnFactory>[1]): Element;
export function column(props: Parameters<typeof columnFactory>[0], fn: () => void): Element;
export function column(a: any, b?: any): Element {
  return columnFactory(a, b);
}

export function container(fn: () => void, props?: Parameters<typeof containerFactory>[1]): Element;
export function container(props: Parameters<typeof containerFactory>[0], fn: () => void): Element;
export function container(a: any, b?: any): Element {
  return containerFactory(a, b);
}

export function hero(fn: () => void, props?: Parameters<typeof heroFactory>[1]): Element;
export function hero(props: Parameters<typeof heroFactory>[0], fn: () => void): Element;
export function hero(a: any, b?: any): Element {
  return heroFactory(a, b);
}

export function card(fn: (card: Element) => void, props?: CardProps): Element;
export function card(props: CardProps, fn: (card: Element) => void): Element;
export function card(a: any, b?: any): Element {
  return cardFactory(a, b);
}

export function app(props: AppProps, fn: () => void): Element {
  return appFactory(props, fn);
}

export function dialog(fn: (dlg: DialogElement) => void, props?: DialogProps): DialogElement;
export function dialog(props: DialogProps, fn: (dlg: DialogElement) => void): DialogElement;
export function dialog(a: any, b?: any): DialogElement {
  return dialogFactory(a, b);
}

export function alertDialog(props?: AlertDialogProps): AlertDialogElement {
  return alertDialogFactory(props);
}

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

export function breadcrumb(items: BreadcrumbItem[], props?: BreadcrumbProps): Element {
  return breadcrumbFactory(items, props);
}

export function sheet(fn: (s: SheetElement) => void, props?: SheetProps): SheetElement;
export function sheet(props: SheetProps, fn: (s: SheetElement) => void): SheetElement;
export function sheet(a: any, b?: any): SheetElement {
  return sheetFactory(a, b);
}

export function drawer(fn: (d: DrawerElement) => void, props?: DrawerProps): DrawerElement;
export function drawer(props: DrawerProps, fn: (d: DrawerElement) => void): DrawerElement;
export function drawer(a: any, b?: any): DrawerElement {
  return drawerFactory(a, b);
}

export function tabs(fn: (t: TabsElement) => void, props?: TabsProps): TabsElement;
export function tabs(props: TabsProps, fn: (t: TabsElement) => void): TabsElement;
export function tabs(a: any, b?: any): TabsElement {
  return tabsFactory(a, b);
}

export function accordion(fn: (a: AccordionElement) => void, props?: AccordionProps): AccordionElement;
export function accordion(props: AccordionProps, fn: (a: AccordionElement) => void): AccordionElement;
export function accordion(a: any, b?: any): AccordionElement {
  return accordionFactory(a, b);
}

export function collapsible(fn: (c: CollapsibleElement) => void, props?: CollapsibleProps): CollapsibleElement;
export function collapsible(props: CollapsibleProps, fn: (c: CollapsibleElement) => void): CollapsibleElement;
export function collapsible(a: any, b?: any): CollapsibleElement {
  return collapsibleFactory(a, b);
}

export function confirm(message: string, options?: ConfirmOptions): Promise<boolean> {
  return confirmFactory(message, options);
}

export function prompt(message: string, options?: PromptOptions): Promise<string | null> {
  return promptFactory(message, options);
}

export function choose(
  message: string,
  choices: ChooseOption[],
  options?: ChooseOptions,
): Promise<string | null> {
  return chooseFactory(message, choices, options);
}

export function notify(message: string, typeOrOptions?: NotifyType | NotifyOptions): void {
  notifyCore(message, typeOrOptions);
}

export function navigate(path: string): void {
  navigateCore(path);
}

export function download(filename: string, mime: string, content: string): void {
  downloadCore(filename, mime, content);
}

export function clipboard(content: string): void {
  clipboardCore(content);
}

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

export function refreshable(fn: () => void): RefreshableElement {
  return new RefreshableElement(fn);
}

export function page(path: string, fn: () => void, options?: PageOptions): void {
  corePage(path, fn, options);
}

export type RunConfig = BadUIServerConfig & {
  /** Global dashboard shell; wraps every page unless `ui.page(..., { shell: false })`. */
  app?: AppProps;
};

let runCalled = false;

/** Whether `ui.run` has been invoked in this process (used by the `badui` CLI). */
export function wasRunCalled(): boolean {
  return runCalled;
}

/** Test / CLI helper: clear the run-called flag. */
export function resetRunState(): void {
  runCalled = false;
}

/**
 * Start the BadUI server.
 *
 * - `ui.run(config?)` — current pages + optional global shell
 * - `ui.run(root, config?)` — NiceGUI-style root page: registers `/` if missing, then starts
 */
export function run(config?: RunConfig): BadUIServer;
export function run(root: PageFn, config?: RunConfig): BadUIServer;
export function run(rootOrConfig: PageFn | RunConfig = {}, config: RunConfig = {}): BadUIServer {
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

  const { app: appProps, ...serverConfig } = cfg;
  if (appProps) {
    setPageWrapper((pageFn) => app(appProps, pageFn));
  } else {
    setPageWrapper(null);
  }

  runCalled = true;
  const server = new BadUIServer(serverConfig);
  server.start();
  return server;
}

export const ui = {
  label,
  button,
  input,
  checkbox,
  switch: switch_,
  select,
  radioGroup,
  combobox,
  date,
  tooltip,
  avatar,
  skeleton,
  slider,
  textArea,
  link,
  badge,
  alert,
  spinner,
  progress,
  separator,
  icon,
  markdown,
  html,
  image,
  upload,
  stat,
  dataTable,
  table,
  chart,
  areaChart,
  barChart,
  lineChart,
  pieChart,
  radarChart,
  radialChart,
  row,
  column,
  container,
  hero,
  card,
  app,
  dialog,
  alertDialog,
  dropdownMenu,
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
  download,
  clipboard,
  timer,
  storage,
  theme,
  refreshable,
  page,
  run,
  loadPages,
  navFromPages,
};

export default ui;
