export type HtmxSwap =
  | "innerHTML"
  | "outerHTML"
  | "beforebegin"
  | "afterbegin"
  | "beforeend"
  | "afterend"
  | "delete"
  | "none";

export interface HtmxConfig {
  get?: string;
  post?: string;
  put?: string;
  delete?: string;
  patch?: string;
  trigger?: string;
  target?: string;
  swap?: HtmxSwap | string;
  vals?: Record<string, any> | string;
  pushUrl?: boolean | string;
  select?: string;
  indicator?: string;
  confirm?: string;
  disable?: boolean;
  replaceUrl?: boolean | string;
  sync?: string;
  headers?: Record<string, string> | string;
  [key: string]: any; // Allow for other hx-* attributes or custom extensions
}

/**
 * Generates an object of HTMX attributes based on the configuration.
 */
export function htmx(config: HtmxConfig): Record<string, string> {
  const attributes: Record<string, string> = {};

  if (config.get) attributes["hx-get"] = config.get;
  if (config.post) attributes["hx-post"] = config.post;
  if (config.put) attributes["hx-put"] = config.put;
  if (config.delete) attributes["hx-delete"] = config.delete;
  if (config.patch) attributes["hx-patch"] = config.patch;

  if (config.trigger) attributes["hx-trigger"] = config.trigger;
  if (config.target) attributes["hx-target"] = config.target;
  if (config.swap) attributes["hx-swap"] = config.swap;
  
  if (config.vals) {
    attributes["hx-vals"] = typeof config.vals === 'string' 
      ? config.vals 
      : JSON.stringify(config.vals);
  }

  if (config.pushUrl !== undefined) {
    attributes["hx-push-url"] = config.pushUrl.toString();
  }
  
  if (config.select) attributes["hx-select"] = config.select;
  if (config.indicator) attributes["hx-indicator"] = config.indicator;
  if (config.confirm) attributes["hx-confirm"] = config.confirm;
  
  if (config.disable) attributes["hx-disable"] = "";
  
  if (config.replaceUrl !== undefined) {
    attributes["hx-replace-url"] = config.replaceUrl.toString();
  }

  if (config.sync) attributes["hx-sync"] = config.sync;

  if (config.headers) {
    attributes["hx-headers"] = typeof config.headers === 'string'
      ? config.headers
      : JSON.stringify(config.headers);
  }

  // Handle other hx- attributes passed in config
  Object.keys(config).forEach(key => {
    if (key.startsWith('hx-')) {
        attributes[key] = config[key];
    }
  });

  return attributes;
}

/**
 * Generates a string of HTMX attributes for direct HTML insertion.
 */
export function htmxString(config: HtmxConfig): string {
    const attrs = htmx(config);
    return Object.entries(attrs)
        .map(([key, value]) => value ? `${key}='${value}'` : key)
        .join(" ");
}
