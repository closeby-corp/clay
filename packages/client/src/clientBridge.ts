/** Prefixes for BadUI browser/client/tab storage scopes in Web Storage. */
export const BADUI_BROWSER_STORAGE_KEY = 'badui-browser-storage';
export const BADUI_CLIENT_STORAGE_KEY = 'badui-client-storage';
export const BADUI_TAB_STORAGE_KEY = 'badui-tab-storage';

function readBag(storage: Storage, key: string): Record<string, unknown> {
  try {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore corrupt bags
  }
  return {};
}

function writeBag(storage: Storage, key: string, bag: Record<string, unknown>): void {
  try {
    storage.setItem(key, JSON.stringify(bag));
  } catch {
    // quota / private mode
  }
}

export function loadBrowserStorageBag(): Record<string, unknown> {
  try {
    return readBag(localStorage, BADUI_BROWSER_STORAGE_KEY);
  } catch {
    return {};
  }
}

export function loadClientStorageBag(): Record<string, unknown> {
  try {
    return readBag(sessionStorage, BADUI_CLIENT_STORAGE_KEY);
  } catch {
    return {};
  }
}

export function loadTabStorageBag(): Record<string, unknown> {
  try {
    return readBag(sessionStorage, BADUI_TAB_STORAGE_KEY);
  } catch {
    return {};
  }
}

export function applyClientStorageOp(msg: {
  scope: 'browser' | 'client' | 'tab';
  action: 'set' | 'delete' | 'clear';
  key?: string;
  value?: unknown;
}): void {
  try {
    const store = msg.scope === 'browser' ? localStorage : sessionStorage;
    const bagKey =
      msg.scope === 'browser'
        ? BADUI_BROWSER_STORAGE_KEY
        : msg.scope === 'tab'
          ? BADUI_TAB_STORAGE_KEY
          : BADUI_CLIENT_STORAGE_KEY;
    if (msg.action === 'clear') {
      store.removeItem(bagKey);
      return;
    }
    const bag = readBag(store, bagKey);
    if (msg.action === 'delete' && msg.key) {
      delete bag[msg.key];
    } else if (msg.action === 'set' && msg.key) {
      bag[msg.key] = msg.value;
    }
    writeBag(store, bagKey, bag);
  } catch {
    // ignore
  }
}

export function applyScrollOp(msg: {
  target: 'window' | 'selector';
  top?: number | 'top' | 'bottom';
  left?: number;
  behavior?: 'auto' | 'smooth';
  selector?: string;
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
}): void {
  const behavior = msg.behavior ?? 'auto';
  if (msg.target === 'selector' && msg.selector) {
    const el = document.querySelector(msg.selector);
    if (el) {
      el.scrollIntoView({
        behavior,
        block: msg.block ?? 'start',
        inline: msg.inline ?? 'nearest',
      });
    }
    return;
  }

  let top = 0;
  if (msg.top === 'bottom') {
    top = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
  } else if (msg.top === 'top' || msg.top == null) {
    top = 0;
  } else {
    top = msg.top;
  }
  window.scrollTo({ top, left: msg.left ?? 0, behavior });
}

/** Evaluate trusted server-authored JS (NiceGUI-style). */
export function runClientJavaScript(code: string): void {
  // Indirect eval keeps a clean global scope for snippets.
  // eslint-disable-next-line no-eval
  (0, eval)(code);
}
