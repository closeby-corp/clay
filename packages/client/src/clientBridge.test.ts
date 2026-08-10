import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  applyClientStorageOp,
  CLAY_CLIENT_STORAGE_KEY,
  CLAY_TAB_STORAGE_KEY,
  loadClientStorageBag,
  loadTabStorageBag,
} from './clientBridge';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

describe('tab / client sessionStorage bags', () => {
  let sessionStore: Storage;

  beforeEach(() => {
    sessionStore = createMemoryStorage();
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: sessionStore,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'sessionStorage');
  });

  test('loadTabStorageBag reads empty bag', () => {
    expect(loadTabStorageBag()).toEqual({});
  });

  test('applyClientStorageOp write-through + loadTabStorageBag round-trip', () => {
    applyClientStorageOp({
      scope: 'tab',
      action: 'set',
      key: 'files',
      value: [{ name: 'a.txt' }],
    });
    expect(loadTabStorageBag()).toEqual({ files: [{ name: 'a.txt' }] });
    expect(sessionStore.getItem(CLAY_TAB_STORAGE_KEY)).toContain('a.txt');

    applyClientStorageOp({ scope: 'tab', action: 'delete', key: 'files' });
    expect(loadTabStorageBag()).toEqual({});

    applyClientStorageOp({ scope: 'tab', action: 'set', key: 'n', value: 1 });
    applyClientStorageOp({ scope: 'tab', action: 'clear' });
    expect(loadTabStorageBag()).toEqual({});
    expect(sessionStore.getItem(CLAY_TAB_STORAGE_KEY)).toBeNull();
  });

  test('tab and client bags stay separate under sessionStorage', () => {
    applyClientStorageOp({
      scope: 'tab',
      action: 'set',
      key: 'shared',
      value: 'tab-val',
    });
    applyClientStorageOp({
      scope: 'client',
      action: 'set',
      key: 'shared',
      value: 'client-val',
    });

    expect(loadTabStorageBag()).toEqual({ shared: 'tab-val' });
    expect(loadClientStorageBag()).toEqual({ shared: 'client-val' });
    expect(sessionStore.getItem(CLAY_TAB_STORAGE_KEY)).not.toBe(
      sessionStore.getItem(CLAY_CLIENT_STORAGE_KEY),
    );
  });
});
