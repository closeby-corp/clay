import {
  button as buttonFactory,
  label as labelFactory,
  input as inputFactory,
  checkbox as checkboxFactory,
  select as selectFactory,
  slider as sliderFactory,
  textArea as textAreaFactory,
  link as linkFactory,
  badge as badgeFactory,
  alert as alertFactory,
  stat as statFactory,
  dataTable as dataTableFactory,
  areaChart as areaChartFactory,
  row as rowFactory,
  column as columnFactory,
  container as containerFactory,
  hero as heroFactory,
  card as cardFactory,
  dialog as dialogFactory,
  confirm as confirmFactory,
  prompt as promptFactory,
  choose as chooseFactory,
  app as appFactory,
  type ButtonProps,
  type LabelProps,
  type InputProps,
  type CheckboxProps,
  type SelectProps,
  type SliderProps,
  type TextAreaProps,
  type LinkProps,
  type BadgeProps,
  type AlertProps,
  type StatItem,
  type DataTableProps,
  type DataTableAction,
  type DataTableView,
  type DataTablePrimaryAction,
  type TableColumn,
  type AreaChartProps,
  type AreaChartSeries,
  type CardProps,
  type DialogProps,
  type ConfirmOptions,
  type PromptOptions,
  type ChooseOptions,
  type ChooseOption,
  type AppProps,
  type AppNavItem,
  type AppUser,
  DataTableElement,
  DialogElement,
} from '@badui/components';
import {
  Element,
  RefreshableElement,
  page as corePage,
  getPage,
  notify as notifyCore,
  setPageWrapper,
  type NotifyOptions,
  type NotifyType,
  type PageFn,
  type PageOptions,
  type ToastPosition,
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
  DataTablePrimaryAction,
  TableColumn,
  AreaChartProps,
  AreaChartSeries,
  DialogProps,
  ConfirmOptions,
  PromptOptions,
  ChooseOptions,
  ChooseOption,
  AppProps,
  AppNavItem,
  AppUser,
  NotifyOptions,
  NotifyType,
  ToastPosition,
  PageMeta,
  PageOptions,
  PageFn,
};
export { DataTableElement, DialogElement, loadPages, navFromPages, clearPageMeta };

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

export function select(props: SelectProps): Element {
  return selectFactory(props);
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

export function stat(items: StatItem[], props?: { className?: string }): Element {
  return statFactory(items, props);
}

export function dataTable(data?: unknown, props?: DataTableProps): DataTableElement {
  return dataTableFactory(data, props);
}

export function areaChart(props: AreaChartProps): Element {
  return areaChartFactory(props);
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
  select,
  slider,
  textArea,
  link,
  badge,
  alert,
  stat,
  dataTable,
  areaChart,
  row,
  column,
  container,
  hero,
  card,
  app,
  dialog,
  confirm,
  prompt,
  choose,
  notify,
  refreshable,
  page,
  run,
  loadPages,
  navFromPages,
};

export default ui;
