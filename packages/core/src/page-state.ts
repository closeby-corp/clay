import type { RenderContext } from './context';
import { State } from './state';
import { readStateValue, writeStateValue } from './reactive';

const PAGE_PREFIX = '__page:';

export interface PageState {
  /** Set initial values only for keys that do not exist yet (safe to call every render). */
  defaults(values: Record<string, unknown>): void;
  [key: string]: unknown;
}

type StateStore = {
  has(key: string): boolean;
  getBacking(key: string): State<unknown> | undefined;
  setProp(key: string, value: unknown): void;
  defaultProps(values: Record<string, unknown>): void;
};

function createStateStore(ctx: RenderContext | null): StateStore {
  const local = new Map<string, State<unknown>>();

  const track = (state: State<unknown>) => {
    ctx?.trackState(state);
  };

  const keyFor = (prop: string) => `${PAGE_PREFIX}${prop}`;

  return {
    has(key) {
      if (ctx) return ctx.hasNamedState(key);
      return local.has(key);
    },
    getBacking(key) {
      if (ctx) return ctx.getNamedState(key);
      return local.get(key);
    },
    setProp(key, value) {
      const existing = this.getBacking(key);
      if (existing) {
        writeStateValue(existing, value);
        return;
      }
      const state = new State(value);
      if (ctx) {
        ctx.setNamedState(key, state);
      } else {
        local.set(key, state);
      }
      track(state);
    },
    defaultProps(values) {
      for (const [prop, value] of Object.entries(values)) {
        const key = keyFor(prop);
        if (!this.has(key)) {
          this.setProp(key, value);
        }
      }
    },
  };
}

export function createPageState(ctx: RenderContext | null): PageState {
  const store = createStateStore(ctx);

  return new Proxy({} as PageState, {
    get(_target, prop) {
      if (prop === 'defaults') {
        return (values: Record<string, unknown>) => store.defaultProps(values);
      }

      if (typeof prop !== 'string') {
        return undefined;
      }

      const backing = store.getBacking(`${PAGE_PREFIX}${prop}`);
      if (!backing) {
        return undefined;
      }

      return readStateValue(backing);
    },

    set(_target, prop, value) {
      if (typeof prop !== 'string') {
        return false;
      }

      store.setProp(`${PAGE_PREFIX}${prop}`, value);
      return true;
    },
  });
}
